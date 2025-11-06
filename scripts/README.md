# AAC Image Generation Script

This script generates AAC card images using Google's Gemini 2.5 Flash Image API and automatically uploads them to Supabase.

## Features

- Uses Gemini 2.5 Flash Image for AI-powered image generation
- Accepts local base images as input for style consistency
- Batch processing support
- **Smart Workflow**: Creates DB record first → Generates image → Saves locally → Uploads to Supabase
- **UUID-based filenames**: Images saved as `{card-id}.png` for easy tracking
- Local backup of all generated images in `./generated-images/`
- Automatic insertion and update in `aac_master_cards` table
- Retry logic for failed generations
- Progress tracking and detailed reporting

## Prerequisites

1. **Environment Variables** (.env.local):
   ```env
   GOOGLE_GENAI_API_KEY=your_google_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Dependencies**:
   ```bash
   npm install @google/genai @supabase/supabase-js dotenv
   ```

3. **Supabase Setup**:
   - Create a storage bucket named `aac-images` (make it public)
   - Run migration `08_CREATE_AAC_MASTER_TABLES.sql` to create tables

4. **Get Category IDs**:
   ```sql
   SELECT id, name, display_name FROM aac_master_categories;
   ```
   Copy the UUIDs to use in your prompts JSON.

## Usage

### 1. Create a Prompts JSON File

Create a JSON file with your prompts (see `aac-prompts-example.json`):

```json
{
  "batch_1": [
    {
      "keyword": "happy",
      "prompt": "Create a warm, child-friendly illustration...",
      "category_id": "uuid-from-aac_master_categories",
      "image_path": "./images/base.png",
      "order_index": 0,
      "tags": ["emotion", "positive"]
    }
  ]
}
```

**Required Fields**:
- `keyword` - One-word text label for the card
- `prompt` - Detailed description for AI generation
- `category_id` - UUID from `aac_master_categories` table

**Optional Fields**:
- `image_path` - Path to local base image (for style consistency)
- `order_index` - Display order (default: 0)
- `tags` - Array of tags (default: [])

### 2. Prepare Base Images (Optional)

If using base images:
```bash
mkdir images
# Add your base images: base-emotion.png, base-food.png, etc.
```

### 3. Run the Script

```bash
node scripts/generate-aac-images.js scripts/your-prompts.json
```

## Example Workflow

### Step 1: Get Category IDs

Run this query in Supabase SQL Editor:
```sql
SELECT id, name, display_name FROM aac_master_categories ORDER BY order_index;
```

### Step 2: Create Prompts File

```json
{
  "batch_1": [
    {
      "keyword": "happy",
      "prompt": "Create a warm, cheerful illustration showing happiness...",
      "category_id": "abc-123-def-456",
      "image_path": "./images/base.png",
      "order_index": 0,
      "tags": ["emotion", "positive"]
    }
  ]
}
```

### Step 3: Generate Images

```bash
node scripts/generate-aac-images.js my-prompts.json
```

## How It Works (Workflow)

For each card, the script follows this workflow:

1. **Insert Card Record** → Creates entry in `aac_master_cards` table with `is_active=false`
2. **Get UUID** → Database returns the new card ID
3. **Generate Image** → Uses Gemini AI to create the image
4. **Save Locally** → Saves to `./generated-images/{uuid}.png`
5. **Upload to Supabase** → Uploads to Storage bucket as `{uuid}.png`
6. **Update Record** → Updates card with image URL and sets `is_active=true`

This workflow ensures:
- Card IDs are known before image generation
- Local backups are always available
- Failed generations can be retried using the same ID
- Image filenames match database IDs for easy tracking

## Output

The script will:
1. Create `./generated-images/` directory if it doesn't exist
2. Insert card records and get UUIDs
3. Generate images using Gemini AI
4. Save images locally as `{uuid}.png`
5. Upload to Supabase Storage (`aac-images` bucket) as `{uuid}.png`
6. Update card records with final image URLs and activate them
7. Display progress and summary report with card IDs

## Tips

- **Batch Size**: Process 5-10 images per batch to manage API rate limits
- **Base Images**: Use consistent base images for similar styles
- **Prompts**: Be specific about style, colors, and target audience
- **Retry Logic**: Script automatically retries failed generations up to 3 times
- **Delay**: 2-second delay between generations to respect API limits

## Troubleshooting

### Error: "GOOGLE_GENAI_API_KEY not found"
- Add `GOOGLE_GENAI_API_KEY` to `.env.local`

### Error: "category_id not found"
- Make sure category UUID exists in `aac_master_categories` table

### Error: "Image file not found"
- Check `image_path` is correct relative to project root

### Error: "Bucket not found"
- Create `aac-images` bucket in Supabase Storage
- Make it public for URL access
