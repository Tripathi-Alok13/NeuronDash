from typing import List, Dict, Any

class DashboardGenerator:
    @staticmethod
    def generate_template(template_type: str, columns: List[str], schema: Dict[str, str]) -> Dict[str, Any]:
        """
        Creates a list of widget layout configurations and queries based on the requested template.
        """
        template_type = template_type.lower()
        
        if template_type == "executive":
            return DashboardGenerator._build_executive(columns, schema)
        elif template_type == "sales":
            return DashboardGenerator._build_sales(columns, schema)
        elif template_type == "student":
            return DashboardGenerator._build_student(columns, schema)
        elif template_type == "hr":
            return DashboardGenerator._build_hr(columns, schema)
        elif template_type == "finance":
            return DashboardGenerator._build_finance(columns, schema)
        elif template_type == "survey":
            return DashboardGenerator._build_survey(columns, schema)
        else: # Default or "auto"
            return DashboardGenerator._build_auto(columns, schema)

    @staticmethod
    def _build_executive(columns: List[str], schema: Dict[str, str]) -> Dict[str, Any]:
        return {
            "title": "Executive Performance & Health",
            "widgets": [
                {
                    "title": "Monthly Recurring Revenue",
                    "chart_type": "kpi",
                    "data_query": {"metric": "mrr", "aggr": "sum"},
                    "positioning_config": {"x": 0, "y": 0, "w": 3, "h": 2}
                },
                {
                    "title": "Customer Acquisition Cost (CAC)",
                    "chart_type": "kpi",
                    "data_query": {"metric": "cac", "aggr": "avg"},
                    "positioning_config": {"x": 3, "y": 0, "w": 3, "h": 2}
                },
                {
                    "title": "LTV:CAC Ratio",
                    "chart_type": "kpi",
                    "data_query": {"metric": "ltv_cac", "aggr": "formula", "formula": "ltv / cac"},
                    "positioning_config": {"x": 6, "y": 0, "w": 3, "h": 2}
                },
                {
                    "title": "Net Retention Rate (NRR)",
                    "chart_type": "kpi",
                    "data_query": {"metric": "nrr", "aggr": "avg"},
                    "positioning_config": {"x": 9, "y": 0, "w": 3, "h": 2}
                },
                {
                    "title": "YoY Growth Projection",
                    "chart_type": "line",
                    "data_query": {"x": "month", "y": "revenue", "group_by": "year"},
                    "positioning_config": {"x": 0, "y": 2, "w": 8, "h": 4}
                },
                {
                    "title": "Revenue Breakdown by Product Line",
                    "chart_type": "pie",
                    "data_query": {"category": "product_line", "value": "revenue", "aggr": "sum"},
                    "positioning_config": {"x": 8, "y": 2, "w": 4, "h": 4}
                }
            ]
        }

    @staticmethod
    def _build_sales(columns: List[str], schema: Dict[str, str]) -> Dict[str, Any]:
        return {
            "title": "Sales Operations & Pipeline",
            "widgets": [
                {
                    "title": "Total Closed Sales",
                    "chart_type": "kpi",
                    "data_query": {"metric": "sales", "aggr": "sum"},
                    "positioning_config": {"x": 0, "y": 0, "w": 4, "h": 2}
                },
                {
                    "title": "Win Rate",
                    "chart_type": "kpi",
                    "data_query": {"metric": "win_rate", "aggr": "avg"},
                    "positioning_config": {"x": 4, "y": 0, "w": 4, "h": 2}
                },
                {
                    "title": "Sales Funnel Stages",
                    "chart_type": "bar",
                    "data_query": {"x": "funnel_stage", "y": "deal_count", "aggr": "sum"},
                    "positioning_config": {"x": 0, "y": 2, "w": 6, "h": 4}
                },
                {
                    "title": "Top Sales Representatives",
                    "chart_type": "bar",
                    "data_query": {"x": "sales_rep", "y": "deal_value", "aggr": "sum", "sort": "desc"},
                    "positioning_config": {"x": 6, "y": 2, "w": 6, "h": 4}
                }
            ]
        }

    @staticmethod
    def _build_student(columns: List[str], schema: Dict[str, str]) -> Dict[str, Any]:
        return {
            "title": "Student Academics & Progress Dashboard",
            "widgets": [
                {
                    "title": "Average GPA",
                    "chart_type": "kpi",
                    "data_query": {"metric": "gpa", "aggr": "avg"},
                    "positioning_config": {"x": 0, "y": 0, "w": 4, "h": 2}
                },
                {
                    "title": "Cohort Attendance Rate",
                    "chart_type": "kpi",
                    "data_query": {"metric": "attendance", "aggr": "avg"},
                    "positioning_config": {"x": 4, "y": 0, "w": 4, "h": 2}
                },
                {
                    "title": "Grade Distribution Histogram",
                    "chart_type": "bar",
                    "data_query": {"x": "grade_bin", "y": "student_count", "aggr": "sum"},
                    "positioning_config": {"x": 0, "y": 2, "w": 7, "h": 4}
                },
                {
                    "title": "Subject Level Breakdown",
                    "chart_type": "radar",
                    "data_query": {"category": "subject", "value": "average_score"},
                    "positioning_config": {"x": 7, "y": 2, "w": 5, "h": 4}
                }
            ]
        }

    @staticmethod
    def _build_hr(columns: List[str], schema: Dict[str, str]) -> Dict[str, Any]:
        return {
            "title": "Human Resources & Talent Analytics",
            "widgets": [
                {
                    "title": "Total Headcount",
                    "chart_type": "kpi",
                    "data_query": {"metric": "employee_id", "aggr": "count"},
                    "positioning_config": {"x": 0, "y": 0, "w": 4, "h": 2}
                },
                {
                    "title": "Employee Retention Net Score",
                    "chart_type": "kpi",
                    "data_query": {"metric": "enps", "aggr": "avg"},
                    "positioning_config": {"x": 4, "y": 0, "w": 4, "h": 2}
                },
                {
                    "title": "Staff Growth & Voluntary Attrition",
                    "chart_type": "line",
                    "data_query": {"x": "date", "y": "attrition_rate", "group_by": "department"},
                    "positioning_config": {"x": 0, "y": 2, "w": 8, "h": 4}
                },
                {
                    "title": "Diversity Metric Share",
                    "chart_type": "pie",
                    "data_query": {"category": "gender_ethnicity", "value": "employee_count", "aggr": "sum"},
                    "positioning_config": {"x": 8, "y": 2, "w": 4, "h": 4}
                }
            ]
        }

    @staticmethod
    def _build_finance(columns: List[str], schema: Dict[str, str]) -> Dict[str, Any]:
        return {
            "title": "Corporate Finance & Cash Flow",
            "widgets": [
                {
                    "title": "Gross Profit Margin",
                    "chart_type": "kpi",
                    "data_query": {"metric": "gross_margin", "aggr": "avg"},
                    "positioning_config": {"x": 0, "y": 0, "w": 4, "h": 2}
                },
                {
                    "title": "OpEx Runway (Months)",
                    "chart_type": "kpi",
                    "data_query": {"metric": "runway", "aggr": "sum"},
                    "positioning_config": {"x": 4, "y": 0, "w": 4, "h": 2}
                },
                {
                    "title": "Net Cash Flows (OpEx vs CapEx)",
                    "chart_type": "line",
                    "data_query": {"x": "month", "y": "cash_flow", "group_by": "cash_flow_type"},
                    "positioning_config": {"x": 0, "y": 2, "w": 8, "h": 4}
                },
                {
                    "title": "Expense Category Allocations",
                    "chart_type": "pie",
                    "data_query": {"category": "expense_type", "value": "amount", "aggr": "sum"},
                    "positioning_config": {"x": 8, "y": 2, "w": 4, "h": 4}
                }
            ]
        }

    @staticmethod
    def _build_survey(columns: List[str], schema: Dict[str, str]) -> Dict[str, Any]:
        return {
            "title": "Customer Feedback & Survey Sentiment",
            "widgets": [
                {
                    "title": "Total Respondent Intake",
                    "chart_type": "kpi",
                    "data_query": {"metric": "respondent_id", "aggr": "count"},
                    "positioning_config": {"x": 0, "y": 0, "w": 4, "h": 2}
                },
                {
                    "title": "Net Positive NPS",
                    "chart_type": "kpi",
                    "data_query": {"metric": "nps_score", "aggr": "avg"},
                    "positioning_config": {"x": 4, "y": 0, "w": 4, "h": 2}
                },
                {
                    "title": "Sentiment Responses Spread",
                    "chart_type": "bar",
                    "data_query": {"x": "nps_category", "y": "respondent_count", "aggr": "sum"},
                    "positioning_config": {"x": 0, "y": 2, "w": 6, "h": 4}
                },
                {
                    "title": "Demographic Response Share",
                    "chart_type": "pie",
                    "data_query": {"category": "demographic", "value": "response_count", "aggr": "sum"},
                    "positioning_config": {"x": 6, "y": 2, "w": 6, "h": 4}
                }
            ]
        }

    @staticmethod
    def _build_auto(columns: List[str], schema: Dict[str, str]) -> Dict[str, Any]:
        """
        Dynamically generates charts depending on schema types detected.
        """
        widgets = []
        numeric_cols = [c for c, t in schema.items() if t == "numeric"]
        categorical_cols = [c for c, t in schema.items() if t == "categorical"]
        datetime_cols = [c for c, t in schema.items() if t == "datetime"]
        identifier_cols = [c for c, t in schema.items() if t == "identifier"]
        
        # 1. Generate KPIs for the first 3 numeric/identifier columns
        kpi_cols = []
        for c in numeric_cols:
            kpi_cols.append((c, "numeric"))
        for c in identifier_cols:
            kpi_cols.append((c, "identifier"))
            
        for idx, (col_name, col_type) in enumerate(kpi_cols[:3]):
            title = f"Average {col_name.title()}" if col_type == "numeric" else f"Unique {col_name.title()}"
            widgets.append({
                "title": title,
                "chart_type": "kpi",
                "data_query": {"metric": col_name, "aggr": "avg"},
                "positioning_config": {"x": idx * 4, "y": 0, "w": 4, "h": 2}
            })
            
        # 2. Generate line chart if we have datetime + numeric
        if datetime_cols and numeric_cols:
            widgets.append({
                "title": f"{numeric_cols[0].title()} Trend Over Time",
                "chart_type": "line",
                "data_query": {"x": datetime_cols[0], "y": numeric_cols[0], "aggr": "sum"},
                "positioning_config": {"x": 0, "y": 2, "w": 8, "h": 4}
            })
            
        # 3. Generate bar chart for categories
        if categorical_cols and numeric_cols:
            widgets.append({
                "title": f"{numeric_cols[0].title()} by {categorical_cols[0].title()}",
                "chart_type": "bar",
                "data_query": {"x": categorical_cols[0], "y": numeric_cols[0], "aggr": "sum"},
                "positioning_config": {"x": 8, "y": 2, "w": 4, "h": 4} if datetime_cols else {"x": 0, "y": 2, "w": 12, "h": 4}
            })
        elif categorical_cols:
            widgets.append({
                "title": f"Count by {categorical_cols[0].title()}",
                "chart_type": "pie",
                "data_query": {"category": categorical_cols[0], "value": categorical_cols[0], "aggr": "count"},
                "positioning_config": {"x": 0, "y": 2, "w": 12, "h": 4}
            })
            
        return {
            "title": "AI Automatically Synthesized Dashboard",
            "widgets": widgets
        }
