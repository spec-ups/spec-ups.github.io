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
    id: "surface-tension",
    title: "Surface Tension",
    description: "Tap and swipe to pop bubbles before they break the surface. Chain pops, dodge ink and dive deeper across five modes.",
    category: "game",
    url: "projects/surface-tension/index.html",
    embed: true,
    emoji: "🫧",
    tags: ["Canvas", "Web Audio", "Arcade"],
    status: "New",
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
