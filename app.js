const currentDate = new Date();
let timeFormat = 1;
switchFormat(0);

const lat = getId("latitude");
const lng = getId("longitude");
const timeZone = getId("timezone");
const dst = getId("dst");
const method = getId("method");
const juristicMethod = getId("juristicMethod");
const inputSearchCity = getId("inputSearchCity");

// display monthly timetable
function displayMonth(offset) {
  prayTimes.setMethod(method.value);
  prayTimes.adjust({ asr: juristicMethod.value }); // {fajr: 16, dhuhr: '5 min', asr: 'Hanafi', isha: 15}

  currentDate.setMonth(currentDate.getMonth() + 1 * offset);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const title = monthFullName(month) + " " + year;

  getId("table-title").innerHTML = title;
  getId("city-name").innerHTML = inputSearchCity.value;

  // Get the selected option
  const selectedMethod = method.options[method.selectedIndex];
  const selectedJuristic = juristicMethod.options[juristicMethod.selectedIndex];

  getId(
    "setting-details"
  ).innerHTML = `${selectedMethod.text} <em>${selectedJuristic.text}</em>`;

  makeTable(year, month, lat.value, lng.value, timeZone.value, dst.value);
}

// make monthly timetable
function makeTable(year, month, lat, lng, timeZone, dst) {
  const items = {
    day: "Day",
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    sunset: "Sunset",
    maghrib: "Maghrib",
    isha: "Isha",
  };

  const tbody = document.createElement("tbody");
  tbody.appendChild(makeTableRow(items, items, "head-row"));

  const date = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 1);
  const format = timeFormat ? "12h" : "24h";

  while (date < endDate) {
    const times = prayTimes.getTimes(date, [lat, lng], timeZone, dst, format);

    times.day = date.getDate();
    const today = new Date();
    const isToday =
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    const klass = isToday ? "today-row" : null;

    tbody.appendChild(makeTableRow(times, items, klass));
    date.setDate(date.getDate() + 1); // next day
  }

  removeAllChild(getId("timetable"));
  getId("timetable").appendChild(tbody);
}

// make a table row
function makeTableRow(data, items, klass) {
  const row = document.createElement("tr");

  for (let i in items) {
    const cell = document.createElement("td");
    cell.innerHTML = data[i];
    row.appendChild(cell);
  }

  if (klass) row.className = klass;

  return row;
}

// remove all children of a node
function removeAllChild(node) {
  if (node == undefined || node == null) return;

  while (node.firstChild) node.removeChild(node.firstChild);
}

// switch time format
function switchFormat(offset) {
  const formats = ["24-hour", "12-hour"];
  timeFormat = (timeFormat + offset) % 2;

  console.log("time format:", formats[timeFormat]);
  // update();
}

// update table
function update() {
  displayMonth(0);
}

// return month full name
function monthFullName(month) {
  const monthName = new Array(
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  );
  return monthName[month];
}

function getId(id) {
  return document.getElementById(id);
}

/* @return A timezone offset */
const getOffset = (timeZone = "UTC", date = new Date()) => {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));

  const offsetMinutes = (tzDate.getTime() - utcDate.getTime()) / 60000; // Offset in minutes
  const offsetHours = offsetMinutes / 60; // Offset in hours

  return offsetHours;
};

// autocomplete
$("#inputSearchCity")
  .typeahead(
    {
      hint: false,
      highlight: true,
    },
    {
      name: "cities",
      display: (item) => `${item.city}, (zip: ${item.zip})`,
      source: function (query, syncResults, asyncResults) {
        fetch("./data/us-cities.json")
          .then((res) => res.json())
          .then((data) => {
            const filteredData = data
              .filter((item) => {
                const q = query.toLowerCase();
                return (
                  item.city.toLowerCase().includes(q) ||
                  String(item.zip).includes(q)
                );
              })
              .slice(0, 10);

            asyncResults(filteredData);
          });
      },
    }
  )
  .on("typeahead:select", function (e, selectedCity) {
    lat.value = selectedCity.lat;
    lng.value = selectedCity.lng;
    timeZone.value = getOffset(selectedCity.timezone);
    // cityName.innerText = selectedCity.city;
  });
