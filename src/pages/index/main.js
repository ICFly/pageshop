import a from 'a.js';

alert("You're in index page")

fetch('/api/a').then(
    response=>response.json()
).then(
    console.log.bind(console)
)