from app.db2 import supabase


def get_active_faq_items():
    try:
        response = (
            supabase.table("faq")
            .select("id, question, answer, category, display_order")
            .eq("is_active", True)
            .order("display_order")
            .execute()
        )
        return response.data or []
    except Exception as e:
        print("Error fetching FAQ items:\n", e)
        return []
