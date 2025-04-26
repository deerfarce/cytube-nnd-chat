# Niconico Chat for CyTube

This is a script that adds a chat feature similar to comments on [Niconico](https://www.nicovideo.jp/), where chat messages are placed on top of the video and scrolled to the side.

## Setup

If done correctly, the script will start working right away, and a button will appear underneath the chat area which opens the Niconico settings.
If you're using CyTube Enhanced or BillTube, the button will appear at the top of the page.

<br>

The easiest way to add this to your room is to paste this into the room's JavaScript editor:
```js
$.get('https://cdn.jsdelivr.net/gh/deerfarce/cytube-nnd-chat@master/index.js')
```
<br>
<br>

If you use a module loader such as Xaekai's, here's an example of what to add onto the module list:
```js
'nnd': { active: 1, rank: -1, url: "https://cdn.jsdelivr.net/gh/deerfarce/cytube-nnd-chat@master/index.js", callback: true }
```

If you feel safer using a specific commit rather than a branch, replace `master` in the link with a commit hash.
