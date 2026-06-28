import pandas as pd
import re
import json
import numpy as np
from typing import Dict, Any, List
from app.core.config import settings
from app.services.cleaner import DataCleaner

class AIAssistant:
    @staticmethod
    def process_query(df: pd.DataFrame, prompt: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Processes natural language data queries by calling ChatGPT or Claude when keys are present,
        or falling back to a comprehensive local conversational simulator.
        """
        prompt_lower = prompt.lower().strip()
        
        # 1. Try Anthropic (Claude) if configured
        if settings.ANTHROPIC_API_KEY:
            try:
                from anthropic import Anthropic
                client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                
                # Dynamic Schema Info & Preview Context
                inferred_types = {col: DataCleaner._infer_column_type(df[col], col) for col in df.columns}
                schema_info = {col: {"type": inferred_types[col], "pandas_dtype": str(df[col].dtype)} for col in df.columns}
                row_count = len(df)
                preview_info = df.head(3).to_dict(orient="records")
                
                system_prompt = f"""You are NeuronDash's AI data assistant, helping the user analyze their uploaded dataset.

Here is the dataset metadata as context:
- Column count: {len(df.columns)}
- Row count: {row_count}
- Schema details (column names and inferred types):
{json.dumps(schema_info, indent=2)}

Here is a preview of the first 3 rows of the data:
{json.dumps(preview_info, indent=2)}

Instructions:
1. Respond naturally and conversationally to greetings or small talk (e.g., "hii", "do me a favour", "thanks!"). Do not perform any calculations or recommend charts for simple conversation.
2. Only perform data analysis (stats, correlations, outlier detection, charts) when the user actually asks a data-related question.
3. Keep responses concise unless the user asks for detail.
4. You MUST output a valid raw JSON object. Do not include any markdown formatting wrappers like ```json ... ``` or other text around the JSON block. Just output the JSON itself.
5. The JSON object must contain these keys:
   - "response_text": a detailed explanation in markdown. You can use placeholders like {{calc_result}} inside the text if you want, but you must output the final natural language answer.
   - "python_code": (optional, nullable/empty string) a clean, single-line Python expression to calculate the answer on `df`. E.g., `df["GPA"].mean()` or `df.groupby("Subject")["GPA"].mean().to_dict()`. ONLY return a pure python expression, no assignments, no print statements. Leave empty or null if no computation is needed for the message (e.g. small talk or greetings).
   - "recommended_widget": (optional, nullable) a dictionary config for a widget visualization ONLY if the query warrants a chart. E.g. for aggregations, comparisons, correlations. DO NOT generate a chart for small talk, greetings, or plain text responses. Format:
     {{
       "title": "Title of the chart",
       "chart_type": "kpi" | "bar" | "line" | "pie" | "scatter" | "heatmap" | "area",
       "data_query": {{
         "x": "column name for category/x-axis",
         "y": "column name for values/y-axis",
         "metric": "column name for kpi (if kpi)",
         "aggr": "sum" | "avg" | "count"
       }}
     }}
"""
                formatted_history = AIAssistant._format_history_for_llm(history)
                # If prompt is not the last history element, append it
                if not formatted_history or formatted_history[-1]["content"] != prompt:
                    formatted_history.append({"role": "user", "content": prompt})
                    formatted_history = AIAssistant._format_history_for_llm(formatted_history)

                message = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1000,
                    system=system_prompt,
                    messages=formatted_history
                )
                content_text = "".join([b.text for b in message.content])
                
                # Strip markdown blocks if returned
                clean_json = content_text.strip()
                if clean_json.startswith("```"):
                    clean_json = clean_json.split("```")[1]
                    if clean_json.startswith("json"):
                        clean_json = clean_json[4:]
                
                # Try parsing, using regex as fallback
                try:
                    llm_response = json.loads(clean_json.strip())
                except Exception:
                    match = re.search(r"\{.*\}", clean_json, re.DOTALL)
                    if match:
                        llm_response = json.loads(match.group(0))
                    else:
                        raise
                
                return AIAssistant._handle_llm_payload(llm_response, df)
            except Exception as e:
                print("Anthropic LLM query error:", e)
                
        # 2. Try OpenAI (GPT-4o) if configured
        elif settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                
                # Dynamic Schema Info & Preview Context
                inferred_types = {col: DataCleaner._infer_column_type(df[col], col) for col in df.columns}
                schema_info = {col: {"type": inferred_types[col], "pandas_dtype": str(df[col].dtype)} for col in df.columns}
                row_count = len(df)
                preview_info = df.head(3).to_dict(orient="records")
                
                system_prompt = f"""You are NeuronDash's AI data assistant, helping the user analyze their uploaded dataset.

Here is the dataset metadata as context:
- Column count: {len(df.columns)}
- Row count: {row_count}
- Schema details (column names and inferred types):
{json.dumps(schema_info, indent=2)}

Here is a preview of the first 3 rows of the data:
{json.dumps(preview_info, indent=2)}

Instructions:
1. Respond naturally and conversationally to greetings or small talk (e.g., "hii", "do me a favour", "thanks!"). Do not perform any calculations or recommend charts for simple conversation.
2. Only perform data analysis (stats, correlations, outlier detection, charts) when the user actually asks a data-related question.
3. Keep responses concise unless the user asks for detail.
4. You MUST output a valid raw JSON object. Do not include any markdown formatting wrappers like ```json ... ``` or other text around the JSON block. Just output the JSON itself.
5. The JSON object must contain these keys:
   - "response_text": a detailed explanation in markdown. You can use placeholders like {{calc_result}} inside the text if you want, but you must output the final natural language answer.
   - "python_code": (optional, nullable/empty string) a clean, single-line Python expression to calculate the answer on `df`. E.g., `df["GPA"].mean()` or `df.groupby("Subject")["GPA"].mean().to_dict()`. ONLY return a pure python expression, no assignments, no print statements. Leave empty or null if no computation is needed for the message (e.g. small talk or greetings).
   - "recommended_widget": (optional, nullable) a dictionary config for a widget visualization ONLY if the query warrants a chart. E.g. for aggregations, comparisons, correlations. DO NOT generate a chart for small talk, greetings, or plain text responses. Format:
     {{
       "title": "Title of the chart",
       "chart_type": "kpi" | "bar" | "line" | "pie" | "scatter" | "heatmap" | "area",
       "data_query": {{
         "x": "column name for category/x-axis",
         "y": "column name for values/y-axis",
         "metric": "column name for kpi (if kpi)",
         "aggr": "sum" | "avg" | "count"
       }}
     }}
"""
                formatted_history = AIAssistant._format_history_for_llm(history)
                # If prompt is not the last history element, append it
                if not formatted_history or formatted_history[-1]["content"] != prompt:
                    formatted_history.append({"role": "user", "content": prompt})
                    formatted_history = AIAssistant._format_history_for_llm(formatted_history)

                openai_messages = [{"role": "system", "content": system_prompt}] + formatted_history
                
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=openai_messages,
                    max_tokens=1000
                )
                content_text = response.choices[0].message.content
                
                # Strip markdown blocks if returned
                clean_json = content_text.strip()
                if clean_json.startswith("```"):
                    clean_json = clean_json.split("```")[1]
                    if clean_json.startswith("json"):
                        clean_json = clean_json[4:]
                
                # Try parsing, using regex as fallback
                try:
                    llm_response = json.loads(clean_json.strip())
                except Exception:
                    match = re.search(r"\{.*\}", clean_json, re.DOTALL)
                    if match:
                        llm_response = json.loads(match.group(0))
                    else:
                        raise
                
                return AIAssistant._handle_llm_payload(llm_response, df)
            except Exception as e:
                print("OpenAI LLM query error:", e)

        # 3. Fallback: Local Conversational Mock LLM
        return AIAssistant.mock_conversational_llm(df, prompt_lower, history)

    @staticmethod
    def _format_history_for_llm(history: List[Dict[str, str]]) -> List[Dict[str, str]]:
        if not history:
            return []
        formatted = []
        for msg in history:
            role = msg.get("role")
            content = msg.get("content", "")
            if not content or not content.strip():
                continue
            
            # Map roles to assistant / user
            if role in ["admin", "assistant"]:
                role = "assistant"
            else:
                role = "user"
                
            if formatted and formatted[-1]["role"] == role:
                # Concatenate same role consecutive messages
                formatted[-1]["content"] += "\n\n" + content
            else:
                formatted.append({"role": role, "content": content})
                
        # Ensure first message is user
        while formatted and formatted[0]["role"] != "user":
            formatted.pop(0)
            
        # Ensure last message is user
        while formatted and formatted[-1]["role"] != "user":
            formatted.pop()
            
        return formatted

    @staticmethod
    def _handle_llm_payload(payload: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        py_code = payload.get("python_code", "").strip() if payload.get("python_code") else ""
        response_text = payload.get("response_text", "")
        widget_config = payload.get("recommended_widget")
        
        calc_val = None
        has_calculation = False
        if py_code:
            calc_val = AIAssistant.evaluate_expression(py_code, df)
            has_calculation = True
            # Replace placeholders in text
            if "{calc_result}" in response_text:
                response_text = response_text.replace("{calc_result}", str(calc_val))
            elif "{{calc_result}}" in response_text:
                response_text = response_text.replace("{{calc_result}}", str(calc_val))
            else:
                response_text += f"\n\n**Calculated Output:** `{calc_val}`"
                
        return {
            "content": response_text,
            "recommended_widget": widget_config,
            "status_details": {
                "steps": [
                    {"step": "Analyzing query via LLM API", "status": "completed"},
                    {"step": "Inspecting dataframe variables", "status": "completed"},
                    {"step": f"Executing calculation expression: {py_code}", "status": "completed"}
                ]
            } if has_calculation else None
        }

    @staticmethod
    def evaluate_expression(expr: str, df: pd.DataFrame) -> Any:
        expr = expr.strip()
        
        # Parse the expression using python's AST library to check for safety
        import ast
        try:
            node = ast.parse(expr, mode='eval')
        except Exception:
            return "Calculation failed: Invalid syntax."
            
        # Traverse AST and check for blocked nodes, names, or attributes
        for child in ast.walk(node):
            # Block imports
            if isinstance(child, (ast.Import, ast.ImportFrom)):
                return "Blocked for safety."
            
            # Block dangerous builtins, function names, and module/package access
            if isinstance(child, ast.Name):
                blocked_names = {
                    'eval', 'exec', 'open', 'compile', 'globals', 'locals', 'getattr', 'setattr', 'delattr',
                    'hasattr', 'input', 'shutil', 'socket', 'requests', 'urllib', 'subprocess', 'os', 'sys', '__import__'
                }
                if child.id in blocked_names or child.id.startswith('__'):
                    return "Blocked for safety."
            
            # Block dangerous attribute calls or methods (like read/write or remote code execution)
            if isinstance(child, ast.Attribute):
                blocked_attrs = {
                    'system', 'popen', 'read_csv', 'read_excel', 'read_json', 'read_parquet', 'read_pickle', 
                    'read_sql', 'read_xml', 'read_html', 'to_csv', 'to_excel', 'to_json', 'to_parquet', 
                    'to_pickle', 'to_sql', 'to_xml', 'to_html', 'eval', 'exec', 'query'
                }
                if child.attr in blocked_attrs or child.attr.startswith('__'):
                    return "Blocked for safety."

        try:
            import numpy as np
            locs = {"df": df, "pd": pd, "np": np}
            val = eval(expr, {"__builtins__": {}}, locs)
            if isinstance(val, (int, float, np.number)):
                return round(float(val), 4)
            return val
        except Exception as e:
            return f"Calculation failed: {str(e)}"

    @staticmethod
    def mock_conversational_llm(df: pd.DataFrame, prompt_lower: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Simulates conversational LLM behavior when API keys are not configured.
        Supports greetings, small talk, dataset average calculations, outlier searches, and summaries.
        """
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = df.select_dtypes(exclude=['number']).columns.tolist()
        
        # 1. Greetings / Small Talk
        if any(re.search(r"\b" + re.escape(w) + r"\b", prompt_lower) for w in ["hi", "hii", "hello", "hey", "greetings", "howdy", "who are you", "help"]):
            return {
                "content": "Hello! 👋 I am NeuronDash's AI data assistant, helping you analyze your uploaded dataset. How can I help you today?",
                "recommended_widget": None,
                "status_details": None
            }
            
        elif prompt_lower == "do me a favour":
            return {
                "content": "Of course! I'm here to help. I can calculate metric averages, flag anomalies, plot categorical counts, or summarize overall findings. What would you like me to do?",
                "recommended_widget": None,
                "status_details": None
            }
            
        elif any(w in prompt_lower for w in ["thanks", "thank you"]):
            return {
                "content": "You're very welcome! Let me know if you need any other calculations or insights from your data.",
                "recommended_widget": None,
                "status_details": None
            }
            
        # 2. Average calculations / "Calculate average values"
        elif any(w in prompt_lower for w in ["average", "mean", "median"]):
            # Check if any specific column name is mentioned in the prompt
            mentioned_col = None
            for col in numeric_cols:
                if re.search(r"\b" + re.escape(col.lower()) + r"\b", prompt_lower):
                    mentioned_col = col
                    break
            
            if mentioned_col:
                col = mentioned_col
                val = df[col].mean()
                content = f"Based on the dataset, the average **{col}** is **{val:.2f}**."
                metric_name = col
            # Else, look specifically for a revenue column
            elif "revenue" in prompt_lower:
                revenue_cols = [c for c in df.columns if "revenue" in c.lower()]
                if revenue_cols:
                    col = revenue_cols[0]
                    val = df[col].mean()
                    content = f"Based on the dataset, the average revenue is **{val:.2f}**."
                    metric_name = col
                elif numeric_cols:
                    col = numeric_cols[0]
                    val = df[col].mean()
                    content = f"I couldn't find a 'revenue' column in the dataset, but the average for numeric column **{col}** is **{val:.2f}**."
                    metric_name = col
                else:
                    return {
                        "content": "I couldn't locate any numerical columns in your dataset to calculate average revenue.",
                        "recommended_widget": None,
                        "status_details": None
                    }
            elif numeric_cols:
                col = numeric_cols[0]
                val = df[col].mean()
                content = f"The average for numeric column **{col}** is **{val:.2f}**."
                metric_name = col
            else:
                return {
                    "content": "I couldn't locate any numerical columns in your dataset to calculate averages.",
                    "recommended_widget": None,
                    "status_details": None
                }
                
            return {
                "content": content,
                "recommended_widget": {
                    "title": f"Average {metric_name.title()}",
                    "chart_type": "kpi",
                    "data_query": {"metric": metric_name, "aggr": "avg"}
                },
                "status_details": {
                    "steps": [
                        {"step": "Parsing natural language query", "status": "completed"},
                        {"step": "Inspecting dataframe variables", "status": "completed"},
                        {"step": f"Executing calculation expression: df['{metric_name}'].mean()", "status": "completed"}
                    ]
                }
            }
            
        # 3. Outliers / anomalies / "Flag outliers & anomalies"
        elif any(w in prompt_lower for w in ["anomaly", "outlier", "bad data", "clean"]):
            outlier_details = []
            for col in numeric_cols:
                if DataCleaner._infer_column_type(df[col], col) == "identifier":
                    continue
                q25 = df[col].quantile(0.25)
                q75 = df[col].quantile(0.75)
                iqr = q75 - q25
                if iqr > 0:
                    l_bound = q25 - 1.5 * iqr
                    u_bound = q75 + 1.5 * iqr
                    outliers = df[(df[col] < l_bound) | (df[col] > u_bound)]
                    if len(outliers) > 0:
                        outlier_details.append(f"Column **{col}** has {len(outliers)} outliers outside normal range ({l_bound:.1f} to {u_bound:.1f}).")
            
            if outlier_details:
                content = "I completed an outlier scan on numeric values:\n\n" + "\n".join([f"- {d}" for d in outlier_details])
            else:
                content = "I ran an anomaly scan and found no immediate numeric values out of bounds."
                
            return {
                "content": content,
                "recommended_widget": None,
                "status_details": {
                    "steps": [
                        {"step": "Parsing natural language query", "status": "completed"},
                        {"step": "Inspecting dataframe variables", "status": "completed"},
                        {"step": "Executing standard outlier sweep", "status": "completed"}
                    ]
                }
            }

        # 4. "Plot categorical column counts" / bar counts
        elif any(w in prompt_lower for w in ["plot", "chart", "counts", "count", "categorical"]):
            cat_col = categorical_cols[0] if categorical_cols else (df.columns[0] if len(df.columns) > 0 else None)
            if cat_col:
                content = f"Here is the counts distribution for category column **{cat_col}**."
                return {
                    "content": content,
                    "recommended_widget": {
                        "title": f"{cat_col.title()} Distribution Counts",
                        "chart_type": "bar",
                        "data_query": {"x": cat_col, "y": cat_col, "aggr": "count"}
                    },
                    "status_details": {
                        "steps": [
                            {"step": "Parsing natural language query", "status": "completed"},
                            {"step": "Inspecting dataframe variables", "status": "completed"},
                            {"step": f"Executing groupby count on: {cat_col}", "status": "completed"}
                        ]
                    }
                }
            else:
                return {
                    "content": "No categorical column found to plot distribution counts.",
                    "recommended_widget": None,
                    "status_details": {
                        "steps": [
                            {"step": "Parsing natural language query", "status": "completed"},
                            {"step": "Inspecting dataframe variables", "status": "completed"}
                        ]
                    }
                }

        # 5. Descriptive summary / "Summarize overall findings"
        elif any(w in prompt_lower for w in ["describe", "summary", "stats", "info", "overview", "findings"]):
            content = "Here is a summary of findings from your dataset:\n\n"
            content += "| Column | Type | Non-Null Count | Unique Values |\n"
            content += "| --- | --- | --- | --- |\n"
            for col in df.columns:
                col_type = DataCleaner._infer_column_type(df[col], col)
                non_null = int(df[col].count())
                unique = int(df[col].nunique())
                content += f"| **{col}** | `{col_type}` | {non_null} | {unique} |\n"
                
            return {
                "content": content,
                "recommended_widget": None,
                "status_details": {
                    "steps": [
                        {"step": "Parsing natural language query", "status": "completed"},
                        {"step": "Inspecting dataframe variables", "status": "completed"},
                        {"step": "Compiling schema descriptive stats", "status": "completed"}
                    ]
                }
            }

        # 6. Default Fallback Overview
        content = f"I profiled the active dataset containing **{len(df)} rows** and **{len(df.columns)} columns**.\n\n"
        content += f"- **Categorical values**: {', '.join(categorical_cols) if categorical_cols else 'None'}\n"
        content += f"- **Numeric values**: {', '.join(numeric_cols) if numeric_cols else 'None'}\n\n"
        content += "Ask me questions like:\n"
        content += "- *\"Show the average of [column]\"*\n"
        content += "- *\"Find outliers in the data\"*\n"
        content += "- *\"Summarize overall findings\"*\n"
        
        return {
            "content": content,
            "recommended_widget": None,
            "status_details": None
        }
