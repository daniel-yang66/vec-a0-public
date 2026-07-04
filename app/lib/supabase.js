// import { Client, Account, TablesDB } from "appwrite";

// const client = new Client();

// client
//   .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
//   .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT);

// export const account = new Account(client);
// export const tablesDB = new TablesDB(client);
// export { ID } from "appwrite";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);
