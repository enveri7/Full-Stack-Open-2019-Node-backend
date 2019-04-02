const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')

app.use(express.static('build'))
app.use(cors())

app.use(bodyParser.json())

// Ei toimi
// morgan.token('body', function (req, res) { 
//     return res.body
// })

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

let persons = [
    {
        name: "Seppo Taalasmaa",
        number: "045-112",
        id: 1
    },
    {
        name: "Ulla Taalasmaa",
        number: "045-1121",
        id: 2
    },
    {
        name: "Kari Tapio",
        number: "045-1122",
        id: 3
    },
    {
        name: "Juice Leskinen",
        number: "045-1123",
        id: 4
    }
]
app.get('/api/info', (request, response) => {
    const infoText = `Puhelinluettelossa ${persons.length} henkilön tiedot \n${new Date()}`
    response.set('Content-Type', 'text/plain');
    response.send(infoText)
})

app.get('/api/persons', (request, response) => {
    response.json(persons)
})

app.get('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    const person = persons.find(person => person.id === id)

    if (person) {
        response.json(person)
    } else {
        response.status(404).end()
    }
})

app.post('/api/persons', (request, response) => {
    const body = request.body
    if (!body.name) {
        return response.status(400).json({
            error: 'name missing'
        })
    }

    if (!body.number) {
        return response.status(400).json({
            error: 'number missing'
        })
    }

    const alreadyExists = persons.find(person => person.name === body.name)
    if (alreadyExists) {
        return response.status(400).json({
            error: 'name must be unique'
        })
    }

    const person = request.body

    person.id = Math.floor(Math.random() * 1000000) + 1

    persons = persons.concat(person)

    response.json(person)
})

app.delete('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    const person = persons.find(person => person.id === id)

    if (person) {
        persons = persons.filter(person => person.id !== id)
        response.status(204).end()
    } else {
        response.status(404).end()
    }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})