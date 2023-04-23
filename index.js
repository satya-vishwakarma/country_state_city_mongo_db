var mongoose = require("mongoose");
var async = require("async");
const _ = require("lodash");

//mongoose.createConnection('mongodb://localhost:27017/wyoming');

mongoose
  .connect("mongodb://localhost:27017/wyoming")
  .then(() => console.log("Connected!"));

var countries = require("./data/countries");
var states = require("./data/states");
var cities = require("./data/cities");

var Schema = mongoose.Schema;

mongoose.set("debug", true);

const citySchema = new Schema({
  id: {
    type: Number,
  },
  name: {
    type: String,
  },
  state: {
    type: Schema.Types.ObjectId,
    ref: "State",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const stateSchema = new Schema({
  id: {
    type: Number,
  },
  name: {
    type: String,
  },
  cities: [
    {
      type: Schema.Types.ObjectId,
      ref: "City",
    },
  ],
  country: {
    type: Schema.Types.ObjectId,
    ref: "Country",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const countrySchema = new Schema({
  id: {
    type: Number,
  },
  sortname: {
    type: String,
  },
  name: {
    type: String,
  },
  states: [
    {
      type: Schema.Types.ObjectId,
      ref: "State",
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
});

var Country = mongoose.model("Country", countrySchema);
var State = mongoose.model("State", stateSchema);
var City = mongoose.model("City", citySchema);

async function _saveStates() {
  var countries = await Country.find();

  async.each(
    countries,
    function iteratee(country) {
      const findState = states.filter(function (o) {
        return o.country_id == country.id;
      });

      console.log("==========Started " + country.name + "==============");

      async.each(
        findState,
        async function iteratee(state, next) {
          if (_.isArray(findState) && findState.length > 0) {
            console.log("INSIDE IF");
            var st = new State({
              id: state.id,
              name: state.name,
              country: country._id,
            });

            next();
          } else {
            next();
          }
        },
        function () {
          console.log("All States Done");
          console.log("========== Ended " + country.name + "==============");
        }
      );
    },
    function () {
      console.log("All Countries Done");
    }
  );
}

async function _saveCities() {
  var states = await State.find();

  async.each(
    states,
    function iteratee(state) {
      console.log("==========Started " + state.name + "==============");

      const findCity = cities.filter(function (o) {
        return o.state_id == state.id;
      });

      async.each(
        findCity,
        async function iteratee(city, next) {
          if (_.isArray(findCity) && findCity.length > 0) {
           
            var ct = new City({ id: city.id, name: city.name, state: state });

            await ct.save();

            await State.updateOne(
              { _id: state._id },
              { $push: { cities: ct  } },
              { upsert: true }
            );

            next();
          } else {
            next();
          }
        },
        function () {
          console.log("All Cities Done");
          console.log("========== Ended " + state.name + "==============");
        }
      );
    },
    function () {
      console.log("All States Done");
    }
  );
}

async function _saveCountries() {
  try {
    async.each(
      countries,
      function iteratee(country, next) {
        console.log("------------Loading------>", country.id);
        var cn = new Country({
          id: country.id,
          sortname: country.sortname,
          name: country.name,
        });

        cn.save().then(() => {
          next();
        });
      },
      function () {
        console.log(
          "================= All Countries loaded ==================="
        );
      }
    );
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  saveStates: function () {
    _saveStates();
  },
  saveCities: function () {
    _saveCities();
  },
  saveCountries: function () {
    _saveCountries();
  },
  Country: Country,
  State: State,
  City: City,
};
