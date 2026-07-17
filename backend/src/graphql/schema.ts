// backend/src/graphql/schema.ts
import { Request } from 'express';
import { buildSchema } from 'graphql';
import db from '../config/db.js';

// Define a type match for the context signature we just configured
interface GraphQLContext {
  req: Request & {
    user?: {
      id: string;
    };
  };
}

// 1. Define the executable schema string
export const workspaceSchema = buildSchema(`
  type SidebarNote {
    id: ID!
    title: String!
  }

  type SidebarFolder {
    id: ID!
    name: String!
    notes: [SidebarNote!]!
    subfolders: [SidebarFolder!]!
  }

  type WorkspaceTreePayload {
    rootFolders: [SidebarFolder!]!
    rootNotes: [SidebarNote!]!
  }

  type Query {
    workspaceTree: WorkspaceTreePayload!
  }
`);

// 2. Define operational types for inner processing mapping
interface DBFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
}

interface DBNote {
  id: string;
  title: string;
  folder_id: string | null;
  user_id: string;
}

// 3. Define the functional structural output nodes
interface SidebarFolderNode {
  id: string;
  name: string;
  notes: DBNote[];
  subfolders: SidebarFolderNode[];
}

// 4. Implement core execution root resolver map functions
export const workspaceResolvers = {
  workspaceTree: async (args: any, context: GraphQLContext) => {
    // 🛡️ Guard against unauthenticated requests using your current session paradigm
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Unauthorized access tracking verification failed.');
    }

    // ⚡ CRITICAL: Execute queries in parallel to pull flat database snapshots
    // Replace these template execution placeholders with your actual DB query execution syntax (Knex, Prisma, Mongoose, raw SQL, etc.)
    const [folderResult, noteResult] = await Promise.all([
      db.query<DBFolder>('SELECT id, name, parent_folder_id FROM folders WHERE user_id = $1', [
        userId,
      ]),
      db.query<DBNote>('SELECT id, title, folder_id FROM notes WHERE user_id = $1', [userId]),
    ]);

    const allFolders = folderResult.rows;
    const allNotes = noteResult.rows;

    // Create tracking tables for instantaneous linear node lookup speeds O(1)
    const folderMap: Record<string, SidebarFolderNode> = {};
    const rootFolders: SidebarFolderNode[] = [];
    const rootNotes: DBNote[] = [];

    // Initialize all folders in the mapping dictionary framework
    allFolders.forEach((folder) => {
      folderMap[folder.id] = {
        id: folder.id,
        name: folder.name,
        notes: [],
        subfolders: [],
      };
    });

    // Distribute flat notes into their parent folders or root listings
    allNotes.forEach((note) => {
      if (note.folder_id && folderMap[note.folder_id]) {
        folderMap[note.folder_id].notes.push(note);
      } else {
        rootNotes.push(note);
      }
    });

    // Assemble the recursive tree structure in-memory
    allFolders.forEach((folder) => {
      const folderNode = folderMap[folder.id];
      if (folder.parent_folder_id === null) {
        rootFolders.push(folderNode);
      } else {
        const parentNode = folderMap[folder.parent_folder_id];
        if (parentNode) {
          parentNode.subfolders.push(folderNode);
        } else {
          // Fallback if parent is missing or corrupted
          rootFolders.push(folderNode);
        }
      }
    });

    return {
      rootFolders,
      rootNotes,
    };
  },
};
