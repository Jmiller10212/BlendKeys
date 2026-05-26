export type Keybind = {
  id: string;
  action: string;
  keys: string;
  category: string;
  mode: string;
  description: string;
  tags: string[];
  beginnerPriority: number;
};

export const cheatsheets = [
  {
    title: "Viewport Navigation",
    theme: "Orientation",
    summary: "The muscle memory that makes Blender feel less slippery.",
    steps: [
      { keys: "MMB Drag", label: "Orbit around your model" },
      { keys: "Shift + MMB", label: "Pan the view" },
      { keys: "Wheel", label: "Zoom in and out" },
      { keys: "Numpad .", label: "Frame the selected object" },
    ],
  },
  {
    title: "Object Transform Basics",
    theme: "Placement",
    summary: "Move, rotate, and resize objects without hunting through toolbars.",
    steps: [
      { keys: "G", label: "Move the selected object" },
      { keys: "R", label: "Rotate around the pivot" },
      { keys: "S", label: "Scale from the pivot" },
      { keys: "G X", label: "Move only on the X axis" },
    ],
  },
  {
    title: "Edit Mode Starter",
    theme: "Modeling",
    summary: "The first modeling loop for making and shaping geometry.",
    steps: [
      { keys: "Tab", label: "Enter or leave Edit Mode" },
      { keys: "1 / 2 / 3", label: "Switch vertex, edge, and face selection" },
      { keys: "E", label: "Extrude selected geometry" },
      { keys: "Ctrl + R", label: "Add a loop cut" },
    ],
  },
  {
    title: "Add And Manage Objects",
    theme: "Scene building",
    summary: "Create, duplicate, delete, and recover quickly while blocking out a scene.",
    steps: [
      { keys: "Shift + A", label: "Open the Add menu" },
      { keys: "Shift + D", label: "Duplicate selection" },
      { keys: "X", label: "Delete selection" },
      { keys: "Ctrl + Z", label: "Undo the last action" },
    ],
  },
  {
    title: "Selection Flow",
    theme: "Control",
    summary: "Keep your active selection precise before transforming or modeling.",
    steps: [
      { keys: "A", label: "Select everything" },
      { keys: "Alt + A", label: "Clear selection" },
      { keys: "B", label: "Box select" },
      { keys: "C", label: "Circle select" },
    ],
  },
];

export const glossary = [
  {
    term: "Object Mode",
    definition: "The mode for selecting and transforming whole objects in the scene.",
    context: "Use this when arranging objects, adding new items, or applying transforms.",
  },
  {
    term: "Edit Mode",
    definition: "The mode for editing the internal mesh components of an object.",
    context: "Use this to move vertices, extrude faces, add loop cuts, or reshape geometry.",
  },
  {
    term: "Origin",
    definition: "The point Blender treats as an object's center for transforms and pivots.",
    context: "A misplaced origin can make rotations and scaling feel wrong.",
  },
  {
    term: "Normals",
    definition: "Directions that tell Blender which way faces are pointing.",
    context: "Broken normals can cause odd shading or invisible faces in exports.",
  },
  {
    term: "Modifier",
    definition: "A non-destructive effect that changes an object without permanently editing its base mesh.",
    context: "Common examples include Mirror, Bevel, Subdivision Surface, and Array.",
  },
  {
    term: "Mesh",
    definition: "A 3D object made from vertices, edges, and faces.",
    context: "Most modeling shortcuts work on mesh components in Edit Mode.",
  },
  {
    term: "Vertex",
    definition: "A single point in a mesh.",
    context: "Vertices are the smallest editable mesh component.",
  },
  {
    term: "Edge",
    definition: "A line connecting two vertices.",
    context: "Edges define the structure and flow of a model.",
  },
  {
    term: "Face",
    definition: "A flat surface enclosed by edges.",
    context: "Extruding and insetting faces are core hard-surface modeling actions.",
  },
  {
    term: "Transform",
    definition: "Moving, rotating, or scaling an object or selection.",
    context: "The core transform shortcuts are G, R, and S.",
  },
];
