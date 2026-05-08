// Stub. Step 2 of the build plan replaces this with the full game engine API.
// Re-exporting `shared` here keeps the module non-empty for typecheck and lets
// downstream packages import engine + shared types from one entry point.
export * from '@corpus-quest/shared';
