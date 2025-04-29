// app/api/sheet/route.ts

export async function GET() {
  const sheetUrl =process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;

  try {
    const res = await fetch(sheetUrl);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Failed to fetch Google Sheet data: ${res.status}`);
    }
    const filteredData = data.slice(1).filter((row) => {
      const orderId = row?.["Order ID"];
      return orderId != null && orderId !== "#REF!";
    });

    return Response.json(filteredData);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch Google Sheet data. Please try again later." },
      { status: 500 }
    );
  }
}

