# Social Media Stats Scraper

Outil Python autonome pour extraire les statistiques de vidéos TikTok et Instagram.

## 🔧 Installation

### 1. Créer un environnement virtuel (recommandé)
```bash
cd scraper
python -m venv venv
venv\Scripts\activate  # Windows
# ou source venv/bin/activate  # Linux/Mac
```

### 2. Installer les dépendances
```bash
pip install -r requirements.txt
playwright install chromium
```

---

## 🚀 Utilisation

### Option 1 : API pour l'application React (Recommandé)

Lance l'API Flask pour permettre à l'application Video Manager de récupérer les stats automatiquement :

```bash
python api.py
```

L'API sera disponible sur `http://localhost:5000`

#### Endpoints :
- `GET /health` - Vérifier que l'API fonctionne
- `POST /scrape` - Scraper une URL unique
- `POST /scrape/batch` - Scraper plusieurs URLs

---

### Option 2 : Ligne de commande

```bash
# Scraper une seule URL
python scraper.py --url "https://www.tiktok.com/@user/video/123456"

# Scraper plusieurs URLs depuis un fichier
python scraper.py --file input_urls.txt

# Mode visible (non headless) pour debug
python scraper.py --url "https://..." --visible

# Export CSV en plus du JSON
python scraper.py --file input_urls.txt --csv
```

---

### Option 3 : Import Python

```python
from scraper import SocialMediaScraper

scraper = SocialMediaScraper()
stats = scraper.scrape_url("https://www.tiktok.com/@user/video/123")
print(stats)
```

---

## 📁 Format de sortie

### JSON (output.json)
```json
{
  "scraped_at": "2024-01-30T12:00:00",
  "results": [
    {
      "url": "https://...",
      "platform": "tiktok",
      "views": 12500,
      "likes": 890,
      "comments": 45,
      "shares": 12,
      "scraped_at": "2024-01-30T12:00:01"
    }
  ]
}
```

---

## 🔗 Intégration avec Video Manager

1. **Lance l'API** : `python api.py`
2. **Dans l'app** : Ouvre un projet et ajoute des URLs TikTok/Instagram
3. **Clique sur "Fetch Stats"** : Les stats sont automatiquement récupérées
4. **Page Statistics** : Utilise "Fetch All Stats" pour mettre à jour tous les projets

---

## ⚠️ Limitations & Éthique

- **Usage personnel uniquement** : Cet outil est destiné à extraire les stats de vos propres vidéos
- **Rate limiting** : Délai de 3-5 secondes entre chaque requête
- **Max 10 URLs** par batch pour éviter les blocages
- **Données publiques** : Aucune connexion requise

---

## 🔄 Mise à jour des sélecteurs

Les réseaux sociaux changent régulièrement leur structure HTML. Si le scraper ne fonctionne plus :

1. Ouvrez la page dans Chrome
2. Faites clic-droit > Inspecter sur le compteur de vues/likes
3. Mettez à jour les sélecteurs dans `platforms/tiktok.py` ou `platforms/instagram.py`
