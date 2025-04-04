import { json } from "@remix-run/node";
import fetch from "node-fetch";

// Shopify store details (use environment variables for security)
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

export async function loader({ request }) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id");

  // Check if product_id exists in the query
  if (!productId) {
    return json({ error: "Product ID is required" }, { status: 400 });
  }

  try {
    // Fetch discount information from Shopify's Admin API
    const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/price_rules.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching discounts: ${response.statusText}`);
    }

    const data = await response.json();

    // Find any discounts associated with the product
    const discount = data.price_rules.find(rule =>
      rule.entitled_product_ids.includes(parseInt(productId))
    );

    // Return discount data to the frontend
    return json({
      discount: discount
        ? `${discount.title}: ${discount.value_type === 'percentage' ? discount.value + '%' : '$' + discount.value} Off`
        : null,
    });
  } catch (error) {
    console.error("Error fetching discount data:", error);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}
