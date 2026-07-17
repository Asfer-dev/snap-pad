// frontend/src/graphql/queries.ts

export const GET_WORKSPACE_TREE = `
  query GetWorkspaceTree {
    workspaceTree {
      rootFolders {
        id
        name
        notes {
          id
          title
        }
        subfolders {
          id
          name
          notes {
            id
            title
          }
          subfolders {
            id
            name
            notes {
              id
              title
            }
          }
        }
      }
      rootNotes {
        id
        title
      }
    }
  }
`;
