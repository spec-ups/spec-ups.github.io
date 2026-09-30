/*
 * Your projects live here. To add one, copy an entry and edit it.
 *
 *   id          - short unique slug, used in the project page URL (project.html?id=...)
 *   title       - shown on the card
 *   description - one or two sentences
 *   category    - "game" | "app" | "experiment"
 *   url         - the project itself (e.g. "projects/snake/index.html" or an external URL)
 *   embed       - true to allow "Play here" in a pop-up window on the site (default true
 *                 for local projects; external sites often block this, so set false)
 *   image       - optional screenshot path; if omitted, the emoji + gradient is used
 *   preview     - optional short looping .mp4/.webm clip, played when a card is hovered
 *   emoji       - shown on the gradient thumbnail when there is no image
 *   tags        - short labels (tech, model, etc.)
 *   status      - optional badge, e.g. "New", "WIP"
 *   background  - optional project page background instead of the inkblots:
 *                 "bubbles" (poppable bubbles) or "slimes" (mini slimes falling from the sky)
 *   details     - optional content for the project page:
 *       intro         - list of paragraphs
 *       howTo         - list of steps ("How to play" / "How to use")
 *       howToTitle    - heading for howTo (default "How to play")
 *       features      - list of { name, text } cards
 *       featuresTitle - heading for features (default "Features")
 *       highlights    - list of short bullet points
 *       build         - "Behind the build": { notes: [paragraphs], prompts: [example prompts] }
 */
window.PROJECTS = [
  {
    id: "slime-buddy",
    title: "Slime Buddy",
    description: "A bouncy 3D slime with a mind of its own. Lead it around, carry it, poke it, pet it and feed it, and watch how it feels about all that.",
    category: "experiment",
    url: "projects/slime-buddy/index.html",
    embed: true,
    image: "projects/slime-buddy/thumb.png",
    emoji: "🟩",
    tags: ["Three.js", "WebGL", "Web Audio"],
    status: "New",
    background: "slimes",
    details: {
      intro: [
        "Slime Buddy is somewhere between a Minecraft slime and a kawaii jelly blob: a glossy gumdrop of periwinkle, lilac and rose jelly with a soft core, stubby arms and big sparkly eyes, bouncing around on a bank of pastel clouds.",
        "It has a small brain. Needs for energy, food and company drift over time, and feelings like joy, curiosity, grumpiness, fright and dizziness rise and fade with what you do. Together they decide what it does next and the face it pulls. Open the Brain panel to watch it think."
      ],
      howToTitle: "How to play",
      howTo: [
        "Move your cursor, or press and drag a finger on the ground, and it hops after you. Its eyes follow wherever you point.",
        "Drag it to pick it up, then let go to drop it or fling it to throw it. It bounces, but high places scare it and shaking makes it dizzy.",
        "Drop it from high enough and it splits into three wobbly pieces. Give them a few seconds and they hop back together.",
        "Tap it to poke it. A couple of pokes make it giggle; too many make it grumpy.",
        "Stroke it slowly with the mouse, or rest a finger on it, to pet it. Wiggle fast over it, or tap it in a quick flurry, to tickle it. Just don't overdo it.",
        "Press Ball, then grab the ball and fling it. It chases it, carries it back over its head and begs you to go again. It notices if you only pretend to throw.",
        "Tap the ground to drop a star candy. Watch it dissolve inside the jelly.",
        "Leave it alone and it gets drowsy, yawns, and falls asleep. Poke it to wake it, though it may be cranky about it."
      ],
      featuresTitle: "Moods",
      features: [
        { name: "Happy", text: "Bigger, bouncier hops and a wide smile." },
        { name: "Curious", text: "Something new caught its eye." },
        { name: "Grumpy", text: "Poked once too often. It sulks away from you." },
        { name: "Sleepy", text: "Ignored for a while. Heavy eyelids, then a nap." },
        { name: "Dizzy", text: "Shaken or thrown too hard. It staggers about, or splits into pieces." },
        { name: "Lonely", text: "Missing you. It hops to the front to look for you." },
        { name: "Tickled", text: "Eyes squeezed shut, giggling, arms everywhere." },
        { name: "Playful", text: "Mid-game of fetch, and hoping it never ends." }
      ],
      highlights: [
        "Squash and stretch jelly physics: it crouches before a hop, wobbles when it lands and leans as it moves",
        "Blinks, glances around, waves hello and flails its arms when you pick it up",
        "Hand-drawn expressions for every mood, from sparkly-eyed joy to spiral-eyed dizziness",
        "Remembers you between visits: how often you come, how long you were away, and how close you two are",
        "Synthesised boings, squelches, giggles and munches"
      ]
    }
  },
  {
    id: "surface-tension",
    title: "Surface Tension",
    description: "Tap and swipe to pop bubbles before they break the surface. Chain pops, dodge ink and dive deeper across five modes.",
    category: "game",
    url: "projects/surface-tension/index.html",
    embed: true,
    emoji: "🫧",
    tags: ["Canvas", "Web Audio", "Arcade"],
    status: "New",
    background: "bubbles",
    details: {
      intro: [
        "Surface Tension is a fast arcade game of nerve and fingertips. Bubbles rise from the deep — tap them, or swipe through them, before they break the surface.",
        "Every unbroken pop multiplies the next, and bubbles are worth more the higher you let them climb, so the best scores come from waiting just long enough."
      ],
      howTo: [
        "Tap bubbles, or swipe through several at once, to pop them.",
        "Let a bubble escape and it costs a breath of air.",
        "Avoid ink — it costs a breath (or five seconds on the clock), stops your swipe and clouds the water.",
        "Pop a pearl for a held breath, which saves a chain that would have broken.",
        "The deeper you dive, the stranger the water: the current starts to wander and the light gives out."
      ],
      featuresTitle: "Modes",
      features: [
        { name: "Survival", text: "Dive until your air runs out." },
        { name: "Sprint", text: "Sixty seconds, no air limit." },
        { name: "Blitz", text: "Thirty seconds in a current that keeps quickening." },
        { name: "One Breath", text: "Let one bubble escape and the dive is over." },
        { name: "Zen", text: "No air, no ink, no clock. Just popping." }
      ],
      highlights: [
        "Three difficulties: Gentle, Standard and Riptide",
        "Today's dive — the same seeded run for everyone, every day",
        "Treasures: starfish double your pops, seahorses boost your chain, chests pay out big",
        "Four pop voices and a looping soundtrack",
        "Six depth zones, from the Shallows to the Trench"
      ]
      // build: {
      //   notes: ["How you made it, what the AI did, what you learned."],
      //   prompts: ["An example prompt you used"]
      // }
    }
  }
];
