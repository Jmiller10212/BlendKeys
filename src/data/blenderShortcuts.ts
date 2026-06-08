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

export type LearningPath = {
  title: string;
  level: "Beginner" | "Intermediate";
  summary: string;
  shortcutIds: string[];
  outcomes: string[];
};

export type TipGuide = {
  title: string;
  theme: string;
  summary: string;
  methods: {
    title: string;
    steps: string[];
    relatedShortcutIds: string[];
  }[];
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
  {
    title: "Hard Surface Modeling Basics",
    theme: "Modeling",
    summary: "A compact loop for panels, bevels, support edges, and clean hard-surface shape changes.",
    steps: [
      { keys: "Ctrl + R", label: "Add loop cuts for support geometry" },
      { keys: "I", label: "Inset faces before pushing panels inward" },
      { keys: "Ctrl + B", label: "Bevel sharp edges so they catch light" },
      { keys: "Shift + N", label: "Recalculate normals when shading looks wrong" },
    ],
  },
  {
    title: "UV Unwrap Starter",
    theme: "UV Editing",
    summary: "The basic unwrap flow for getting textures onto a model cleanly.",
    steps: [
      { keys: "Ctrl + E", label: "Mark seams on selected edges" },
      { keys: "U", label: "Open unwrap options" },
      { keys: "U > Unwrap", label: "Create UV islands from marked seams" },
      { keys: "UV > Pack Islands", label: "Pack UV islands into the texture area" },
    ],
  },
  {
    title: "Sculpting Starter",
    theme: "Sculpting",
    summary: "The basic sculpt controls for brush size, strength, smoothing, and masking.",
    steps: [
      { keys: "F", label: "Adjust brush size" },
      { keys: "Shift + F", label: "Adjust brush strength" },
      { keys: "Shift", label: "Temporarily smooth while sculpting" },
      { keys: "Alt + M", label: "Clear the sculpt mask" },
    ],
  },
  {
    title: "Animation Starter",
    theme: "Animation",
    summary: "Create a simple object animation and inspect the keyframes.",
    steps: [
      { keys: "I", label: "Insert a keyframe" },
      { keys: "Space", label: "Play the timeline" },
      { keys: "Up / Down", label: "Jump between keyframes" },
      { keys: "Shift + F6", label: "Open the Graph Editor" },
    ],
  },
  {
    title: "Geometry Nodes Starter",
    theme: "Nodes",
    summary: "Start moving around the node editor without getting lost.",
    steps: [
      { keys: "Shift + A", label: "Open the node add menu" },
      { keys: "Drag Socket", label: "Connect node sockets" },
      { keys: "Ctrl + Right Click Drag", label: "Cut node links" },
      { keys: "M", label: "Mute a selected node" },
    ],
  },
  {
    title: "Camera And Render Flow",
    theme: "Render",
    summary: "Line up a camera, test part of the image, and render the scene.",
    steps: [
      { keys: "Ctrl + Alt + Numpad 0", label: "Align camera to the current view" },
      { keys: "Numpad 0", label: "Look through the camera" },
      { keys: "Ctrl + B", label: "Set a render border for tests" },
      { keys: "F12", label: "Render the current frame" },
    ],
  },
];

export const learningPaths: LearningPath[] = [
  {
    title: "Day 1: Viewport Confidence",
    level: "Beginner",
    summary: "Learn how to move around the scene and frame what matters.",
    shortcutIds: ["orbit", "pan", "zoom", "front-view", "side-view", "top-view", "frame-selected", "toggle-ortho-perspective"],
    outcomes: ["Orbit, pan, and zoom without toolbar hunting", "Jump to front, side, and top views", "Frame the active selection quickly"],
  },
  {
    title: "Day 2: Select And Transform",
    level: "Beginner",
    summary: "Build the base muscle memory for grabbing, rotating, scaling, and constraining movement.",
    shortcutIds: ["select-all", "deselect-all", "box-select", "move", "rotate", "scale", "move-x", "move-y", "move-z"],
    outcomes: ["Select objects predictably", "Use G/R/S transforms", "Constrain transforms to X, Y, and Z"],
  },
  {
    title: "Day 3: Edit Mode Basics",
    level: "Beginner",
    summary: "Enter Edit Mode and shape mesh components directly.",
    shortcutIds: ["mode-toggle", "vertex-select", "edge-select", "face-select", "extrude", "inset", "loop-cut", "make-face-edge"],
    outcomes: ["Switch between selection types", "Extrude and inset faces", "Add loop cuts for more control"],
  },
  {
    title: "Day 4: Clean Modeling",
    level: "Intermediate",
    summary: "Start improving topology, normals, bevels, and mesh cleanup.",
    shortcutIds: ["bevel", "edge-slide", "mark-sharp", "normals-menu", "recalculate-normals-outside", "triangulate-faces", "tris-to-quads"],
    outcomes: ["Fix bad shading with normals", "Use bevels and edge slides", "Understand triangle and quad cleanup tools"],
  },
  {
    title: "Day 5: UV And Materials",
    level: "Intermediate",
    summary: "Prepare a model for texturing with seams, unwraps, UV islands, and materials.",
    shortcutIds: ["mark-seam", "clear-seam", "uv-unwrap", "uv-smart-project", "uv-pack-islands", "material-preview", "assign-material-slot"],
    outcomes: ["Mark seams intentionally", "Unwrap and pack UV islands", "Preview material results in the viewport"],
  },
  {
    title: "Day 6: Animation And Rendering",
    level: "Beginner",
    summary: "Insert keyframes, preview motion, set a camera, and render a frame.",
    shortcutIds: ["insert-keyframe", "play-animation", "previous-keyframe", "next-keyframe", "camera-view", "align-camera-to-view", "render-image"],
    outcomes: ["Create basic keyframes", "Navigate the timeline", "Line up and render from a camera"],
  },
];

export const tipGuides: TipGuide[] = [
  {
    title: "Snap a doorknob flush to a door",
    theme: "Snapping",
    summary: "Use face snapping when one flat object needs to sit cleanly against another, such as a knob plate on a door face.",
    methods: [
      {
        title: "Method 1: Face snapping with the magnet",
        steps: [
          "Select the doorknob object.",
          "In the 3D Viewport header, turn on the magnet icon to enable snapping.",
          "Open the snapping dropdown beside the magnet and choose Face.",
          "Enable Align Rotation to Target if the knob needs to match the door face angle.",
          "Press G to move the knob and hover over the door face until it snaps flush.",
          "Left-click to confirm, then turn snapping off if you do not need it anymore.",
        ],
        relatedShortcutIds: ["move", "snap-toggle", "toggle-xray", "frame-selected"],
      },
      {
        title: "Method 2: Cursor placement for controlled positioning",
        steps: [
          "Select the door face or place the 3D Cursor where the knob should sit.",
          "Use Shift + S and choose Cursor to Selected if you selected geometry first.",
          "Select the doorknob object.",
          "Use Shift + S and choose Selection to Cursor.",
          "Fine-tune with G then local axis constraints if needed.",
        ],
        relatedShortcutIds: ["snap-menu", "cursor-to-selected", "selection-to-cursor", "move-local-axis"],
      },
      {
        title: "Method 3: Numeric offset after snapping",
        steps: [
          "Snap the knob to the door face first.",
          "Start a move with G and constrain to the local normal-facing axis.",
          "Type a tiny offset if the knob clips into the door surface.",
          "Confirm with Enter or Left Click.",
        ],
        relatedShortcutIds: ["numeric-transform", "move-local-axis", "confirm"],
      },
    ],
  },
  {
    title: "Fix weird black shading on a mesh",
    theme: "Shading",
    summary: "Most beginner shading artifacts come from normals, overly sharp geometry, or missing bevels.",
    methods: [
      {
        title: "Recalculate normals",
        steps: [
          "Select the object and press Tab to enter Edit Mode.",
          "Press A to select all mesh components.",
          "Press Shift + N to recalculate normals outside.",
          "If some faces still look wrong, open Alt + N for more normal tools.",
        ],
        relatedShortcutIds: ["mode-toggle", "select-all", "recalculate-normals-outside", "normals-menu"],
      },
      {
        title: "Add small bevels",
        steps: [
          "Select hard edges that look unnaturally sharp.",
          "Press Ctrl + B to bevel them slightly.",
          "Use the mouse wheel to add segments if a softer edge is needed.",
          "Shade Smooth from the right-click menu if appropriate.",
        ],
        relatedShortcutIds: ["bevel", "shade-smooth-menu", "mark-sharp"],
      },
    ],
  },
  {
    title: "Make a simple panel or inset detail",
    theme: "Modeling",
    summary: "Inset and extrude are the core workflow for doors, panels, vents, buttons, and hard-surface details.",
    methods: [
      {
        title: "Inset then push inward",
        steps: [
          "Select the face where the panel should appear.",
          "Press I to inset the face and drag to set the border width.",
          "Press E to extrude the inset face.",
          "Move inward along the correct axis and confirm.",
          "Add a small bevel with Ctrl + B if the edge should catch light.",
        ],
        relatedShortcutIds: ["face-select", "inset", "extrude", "move-local-axis", "bevel"],
      },
    ],
  },
  {
    title: "Line up a camera with the current view",
    theme: "Camera",
    summary: "When you find a good viewport angle, push the camera directly to that view.",
    methods: [
      {
        title: "Align camera to view",
        steps: [
          "Navigate the viewport until the composition looks good.",
          "Press Ctrl + Alt + Numpad 0 to align the active camera to the current view.",
          "Press Numpad 0 to look through the camera.",
          "Use the N panel View options to enable Lock Camera to View for small adjustments.",
          "Press F12 to render a still frame.",
        ],
        relatedShortcutIds: ["align-camera-to-view", "camera-view", "lock-camera-to-view", "render-image"],
      },
    ],
  },
  {
    title: "Select hidden mesh parts without fighting the view",
    theme: "Selection",
    summary: "Use X-Ray or wireframe before selecting through a mesh.",
    methods: [
      {
        title: "X-Ray box selection",
        steps: [
          "Press Alt + Z to enable X-Ray.",
          "Press B for Box Select.",
          "Drag over the front and back components you want selected.",
          "Press Alt + Z again to return to normal solid view.",
        ],
        relatedShortcutIds: ["toggle-xray", "box-select", "toggle-xray-select"],
      },
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
