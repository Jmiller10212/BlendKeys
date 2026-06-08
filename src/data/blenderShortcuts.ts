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
  {
    term: "Pivot Point",
    definition: "The point or rule Blender uses as the center of a transform.",
    context: "Changing the pivot can make rotation and scaling happen around the selection, cursor, median point, or individual origins.",
  },
  {
    term: "3D Cursor",
    definition: "A movable reference point used for adding objects, snapping, and pivot workflows.",
    context: "Shift + C resets it, and Shift + Right Click places it in the viewport.",
  },
  {
    term: "Local Axis",
    definition: "An object's own X, Y, and Z directions after its rotation is considered.",
    context: "Press an axis key twice during transform, such as G then X then X, to use a local axis.",
  },
  {
    term: "Global Axis",
    definition: "The scene's fixed X, Y, and Z directions.",
    context: "Global axes stay the same no matter how an object is rotated.",
  },
  {
    term: "X-Ray",
    definition: "A viewport mode that lets you see and select through objects or mesh surfaces.",
    context: "Alt + Z is useful before box-selecting hidden mesh components.",
  },
  {
    term: "Viewport Overlay",
    definition: "Extra visual information drawn over the viewport, such as grid lines, outlines, origins, and statistics.",
    context: "Overlays help while modeling, but hiding them can make screenshots and previews cleaner.",
  },
  {
    term: "Wireframe",
    definition: "A viewport shading mode that shows mesh edges instead of solid surfaces.",
    context: "Wireframe is useful for seeing topology and selecting through a model.",
  },
  {
    term: "Material Preview",
    definition: "A viewport shading mode that previews materials with studio lighting.",
    context: "Use it to check colors, roughness, and textures without doing a full render.",
  },
  {
    term: "Rendered View",
    definition: "A viewport shading mode that previews the scene using render settings.",
    context: "Rendered view is useful for checking lights, shadows, and camera composition.",
  },
  {
    term: "Topology",
    definition: "The structure and flow of vertices, edges, and faces in a mesh.",
    context: "Clean topology makes models easier to edit, shade, rig, and animate.",
  },
  {
    term: "Edge Loop",
    definition: "A continuous chain of connected edges across a mesh.",
    context: "Edge loops are important for controlling shape and deformation.",
  },
  {
    term: "Loop Cut",
    definition: "A modeling operation that inserts an edge loop through surrounding faces.",
    context: "Ctrl + R is one of the most common ways to add control edges.",
  },
  {
    term: "Bevel",
    definition: "A modeling operation that rounds or chamfers selected edges or vertices.",
    context: "Bevels catch light and make hard-surface models look less computer-sharp.",
  },
  {
    term: "Inset",
    definition: "A modeling operation that creates a smaller face region inside selected faces.",
    context: "Insets are common before extruding panels, windows, buttons, and mechanical details.",
  },
  {
    term: "UV",
    definition: "A 2D coordinate system used to place textures on a 3D mesh.",
    context: "UV editing controls how images wrap around a model.",
  },
  {
    term: "UV Island",
    definition: "A connected group of UV faces separated from other UV groups.",
    context: "Packing UV islands arranges them efficiently inside texture space.",
  },
  {
    term: "Seam",
    definition: "An edge marked as a cut line for UV unwrapping.",
    context: "Mark seams where the mesh can open cleanly into flat UV islands.",
  },
  {
    term: "Unwrap",
    definition: "The process of flattening selected mesh faces into UV space.",
    context: "Good unwraps make textures easier to paint and align.",
  },
  {
    term: "Linked Duplicate",
    definition: "A duplicated object that shares mesh data with the original.",
    context: "Alt + D duplicates are efficient, but editing one linked mesh changes the others.",
  },
  {
    term: "Single User",
    definition: "A copy of data that is no longer shared with linked duplicates.",
    context: "Make data single-user when you want one linked object to become independently editable.",
  },
  {
    term: "Parent",
    definition: "An object that controls another object's transform through a hierarchy.",
    context: "Parenting is useful for moving groups, rigs, cameras, and helper objects together.",
  },
  {
    term: "Empty",
    definition: "A helper object with no renderable geometry.",
    context: "Empties are often used as pivots, controls, targets, and organization handles.",
  },
  {
    term: "Collection",
    definition: "A container for organizing objects in a scene.",
    context: "Collections help manage visibility, selection, rendering, and large scenes.",
  },
  {
    term: "Material",
    definition: "A set of surface properties such as color, roughness, metallic value, and shader setup.",
    context: "Materials define how a model reacts to light.",
  },
  {
    term: "Shader",
    definition: "A node or program that controls how a surface, volume, or light is rendered.",
    context: "Shader nodes are edited in the node editor.",
  },
  {
    term: "Node",
    definition: "A building block in a visual graph for materials, geometry nodes, compositing, or textures.",
    context: "Nodes connect through sockets to pass values, colors, geometry, or shader data.",
  },
  {
    term: "Geometry Nodes",
    definition: "Blender's procedural node system for generating and modifying geometry.",
    context: "Geometry Nodes can scatter objects, create patterns, and build non-destructive modeling systems.",
  },
  {
    term: "Keyframe",
    definition: "A saved value for an animated property at a specific frame.",
    context: "Insert keyframes with I, then Blender interpolates between them over time.",
  },
  {
    term: "Timeline",
    definition: "The editor used to scrub frames, play animation, and control the frame range.",
    context: "Use it to preview motion and jump between animation frames.",
  },
  {
    term: "Graph Editor",
    definition: "An animation editor for adjusting keyframe curves and interpolation.",
    context: "The Graph Editor gives precise control over easing, timing, and motion arcs.",
  },
  {
    term: "Pose Mode",
    definition: "The armature mode used to rotate, move, and animate bones.",
    context: "Use Pose Mode for character posing and rig animation.",
  },
  {
    term: "Armature",
    definition: "A skeleton object made of bones for rigging and animation.",
    context: "Meshes can be bound to armatures so bones deform the model.",
  },
  {
    term: "Render Border",
    definition: "A rectangular region that limits rendering to part of the view.",
    context: "Render borders speed up test renders when only one area needs checking.",
  },
  {
    term: "Asset Browser",
    definition: "Blender's editor for browsing and reusing marked assets.",
    context: "Use it to drag materials, objects, poses, and node groups into projects.",
  },
];
