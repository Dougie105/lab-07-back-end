'use strict'

require('dotenv').config();

//App dependencies
const superagent = require('superagent');
const express = require('express');
const cors = require('cors');

//Initalizers
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

app.listen(PORT, () => console.log(`listening on PORT ${PORT}`));

app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/events', eventBriteHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

//EventBrite

function eventBriteHandler(request, response){
  const url = `https://www.eventbriteapi.com/v3/users/me/?token=${process.env.EVENTBRITE_API_KEY}`

  superagent.get(url)
  .set({'Authorization': `Bearer: ${process.env.EVENTBRITE_API_KEY}`})
    .then( eventData => {
      const eventSummaries = [];
        eventData.body.daily.data.forEach( (day) => {
          eventSummaries.push(new Event(day) )
        });
    
      response.status(200).json(eventSummaries);
    })
    .catch(error => errorHandler(error, request, response));
};

function Event(data) {
  this.name = data.name;
};

//Location

function locationHandler(request, response){
  //Get real data from real API
  // let rawData = require('./data/geo.json');

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`

  superagent.get(url)
    .then(data => {
  let location = new Location(request.query.data, data.body);
  response.status(200).json(location);
  })
  .catch(error => errorHandler(error, request, response))

};

function Location(city, locationData) {
    this.search_query = city;
    this.formatted_query = locationData.results[0].formatted_address;
    this.latitude = locationData.results[0].geometry.location.lat;
    this.longitude = locationData.results[0].geometry.location.lng;
  };

  //Weather

function weatherHandler(request, response){

  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then( weatherData => {
        const weatherSummaries = weatherData.body.daily.data.map( day => {
          return new Weather(day);
        });
        
      response.status(200).json(weatherSummaries);
    })
    .catch(error => errorHandler(error, request, response));
};

function Weather(day){
  this.forecast = day.summary;
  this.time = new Date(day.time *1000).toString().slice(0,15);
}

function notFoundHandler(request, response){
  response.status(404).send('Not Found');
};

function errorHandler(error, request, response){
  response.status(500).send(error);
};

app.use(express.static('./public'));
