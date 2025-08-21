import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

// GET all Menu-Items
export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}

// POST new Menu-Item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const menuItem = await prisma.menuItem.create({
      data: { name }
    });
    
    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
