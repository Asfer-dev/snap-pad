// backend/src/config/swagger.ts
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yamljs';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the path to our openapi.yaml file at the backend root
const yamlPath = path.join(__dirname, '../../openapi.yaml');

// Load and parse the YAML file dynamically
export const swaggerSpec = YAML.load(yamlPath);
