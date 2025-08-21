import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "Bienvenue sur l'API GroupeLab",
    endpoints: {
      "GET /api/menu-items": "Récupérer tous les éléments de menu",
      "POST /api/menu-items": "Créer un nouvel élément de menu",
      "GET /api/menu-items/[id]": "Récupérer un élément de menu par ID",
      "PUT /api/menu-items/[id]": "Mettre à jour un élément de menu",
      "DELETE /api/menu-items/[id]": "Supprimer un élément de menu",
      "GET /api/search": "Rechercher des éléments de menu"
    }
  });
}