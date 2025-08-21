import { prisma } from "../../lib/prisma";
import { NextResponse } from "next/server";

// Search Menu-Items
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      }
    });

    return NextResponse.json({
      query,
      results: menuItems,
      count: menuItems.length
    });
  } catch (error) {
    console.error("Error searching menu items:", error);
    return NextResponse.json({ error: "Failed to search menu items" }, { status: 500 });
  }
}