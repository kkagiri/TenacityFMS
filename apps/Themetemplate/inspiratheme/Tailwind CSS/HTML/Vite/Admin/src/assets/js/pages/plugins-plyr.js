/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Video Player Js
 */

import Plyr from "plyr"
import "plyr/dist/plyr.css"

// standard HTML5 players
const p1 = new Plyr("#player1")
const p3 = new Plyr("#player3")

// YouTube (no extra library required—Plyr handles the provider)
const ytPlayer = new Plyr("#yt1", {
    youtube: { modestbranding: 1, rel: 0, playsinline: 1 },
})

// Vimeo (no extra library required—Plyr handles the provider)
const vimeoPlayer = new Plyr("#vimeo1", {
    vimeo: { byline: false, portrait: false, title: false },
})

// audio
document.addEventListener("DOMContentLoaded", function () {
    window.Plyr && new Plyr("#player-audio")
})
