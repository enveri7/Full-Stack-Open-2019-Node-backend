if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')

const Person = require('./models/person')

mongoose.set('useFindAndModify', false)

app.use(express.static('build'))
app.use(bodyParser.json())
app.use(cors())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

const url = process.env.MONGODB_URI

console.log('connecting to', url)

mongoose.connect(url, { useNewUrlParser: true })
    .then(result => {
        console.log('connected to MongoDB')
    })
    .catch((error) => {
        console.log('error connecting to MongoDB:', error.message)
    })

app.get('/api/info', (request, response, next) => {
    Person.find({}).then(people => {
        const infoText = `Puhelinluettelossa ${people.length} henkilön tiedot \n${new Date()}`
        response.set('Content-Type', 'text/plain');
        response.send(infoText)
    }).catch(error => next(error))

})

app.get('/api/persons', (request, response, next) => {
    Person.find({}).then(people => {
        response.json(people)
    }).catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id).then(person => {
        if (person) {
            response.json(person.toJSON())
        }
    }).catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
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

    const person = new Person({
        name: body.name,
        number: body.number
    })

    person.save().then((p) => {
        response.json(p.toJSON())
    }).catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {

    Person.findByIdAndRemove(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    const person = {
        name: body.name,
        number: body.number,
    }

    Person.findByIdAndUpdate(request.params.id, person, { new: true })
        .then(updatedPerson => {
            response.json(updatedPerson.toJSON())
        })
        .catch(error => next(error))
})

// Virheiden käsittely

const errorHandler = (error, request, response, next) => {

    if (error.name === 'CastError' && error.kind == 'ObjectId') {
        return response.status(400).send({ error: 'malformatted id' })
    }

    next(error)
}

// väärä id
app.use(errorHandler)

const duplicateEntry = (error, request, response, next) => {

    if (error.name === 'MongoError' && error.code == 11000) {
        return response.status(409).send({ error: error.message })
    }
    next(error)
}

// duplikaatti entryn käsittely
app.use(duplicateEntry)

const validateError = (error, request, response, next) => {
    if (error.name === 'ValidationError') {
        return response.status(422).send({ error: error.message })
    }
    next(error)
}

// validaatio error
app.use(validateError)

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

// olemattomien osoitteiden käsittely
app.use(unknownEndpoint)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})