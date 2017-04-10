(() => {
  const SCRIPT_ID = 'CDCalExport';

  // sets the data attributes of the script tag so we can use the data in the content script
  // user and hash are global variables on the site ¯\_(ツ)_/¯
  function setDataAttributes() {
    // eslint-disable-next-line no-undef
    document.currentScript.setAttribute('data-user', user);
    // eslint-disable-next-line no-undef
    document.currentScript.setAttribute('data-hash', hash);
  }


  // inject script into the page to retrieve the global variables user and hash
  function injectScript(code) {
    const script = document.createElement('script');
    script.setAttribute('id', SCRIPT_ID);
    script.appendChild(document.createTextNode(`( ${code} )();`));
    (document.body || document.head || document.documentElement).appendChild(script);

    return Promise.resolve();
  }


  function getDataAttribute(attributeName) {
    const scriptNode = document.querySelector(`#${SCRIPT_ID}`);
    const attributeValue = scriptNode.getAttribute(`data-${attributeName}`);

    return attributeValue;
  }


  function formatDateTime(date, utc) {
    const jsDate = typeof date === 'object' ? date : new Date(date * 1000);
    const leftpad = str => (`00${str}`).substring(str.length);

    const year = jsDate.getFullYear().toString();
    const month = leftpad((jsDate.getMonth() + 1).toString());
    const day = leftpad(utc ? jsDate.getUTCDate().toString() : jsDate.getDate().toString());
    const hour = leftpad(utc ? jsDate.getUTCHours().toString()
                                : jsDate.getHours().toString());
    const minute = leftpad(utc ? jsDate.getUTCMinutes().toString()
                                : jsDate.getMinutes().toString());
    const second = leftpad(utc ? jsDate.getUTCSeconds().toString()
                                : jsDate.getSeconds().toString());

    const datestring = `${year}${month}${day}T${hour}${minute}${second}${utc ? 'Z' : ''}`;

    return datestring;
  }


  function createDownloadButton(text, buttonFunction) {
    const button = document.createElement('a');
    button.setAttribute('class', SCRIPT_ID);
    button.download = 'BA-Kalender.ics';
    button.textContent = text;
    button.onclick = buttonFunction;

    return button;
  }


  function getEvents(user, hash, start, end) {
    const base = 'https://selfservice.campus-dual.de/room/json';

    const url = `${base}?userid=${user}&hash=${hash}&start=${start}&end=${end}`;

    return fetch(url).then(success => success.json());
  }


  function buildICalEvent(event) {
    const iCalEvent =
    `BEGIN:VEVENT
DTSTAMP:${formatDateTime(new Date(), true)}
UID:${event.title}${event.start + event.end}
SUMMARY:${event.title} | ${event.room} | ${event.instructor}
LOCATION:${event.room}
DTSTART:${formatDateTime(event.start, false)}
DTEND:${formatDateTime(event.end, false)}
END:VEVENT
`;

    return iCalEvent;
  }


  function generateCalString(events) {
    const start = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:Campus-Dual-Calendar-Export\nX-WR-CALNAME:BA-Dresden\nX-WR-TIMEZONE:Europe/Berlin\n';
    const end = 'END:VCALENDAR';

    let eventstring = '';
    events.forEach((event) => { eventstring += buildICalEvent(event); });

    const calstring = start + eventstring + end;

    return calstring;
  }


  injectScript(setDataAttributes).then(() => {
    const button = createDownloadButton('loading', () => {});
    const response = getEvents(getDataAttribute('user'), getDataAttribute('hash'), 1490487019, 1490488000);
    response.then(events => generateCalString(events)).then((calstring) => {
      const calblob = new Blob([calstring], { type: 'text/calendar;charset=UTF-8' });
      const url = window.URL.createObjectURL(calblob);
      button.href = url;
    }).then(() => { button.textContent = 'download .ics'; });

    const calendar = document.getElementById('calendar');
    calendar.appendChild(button);
  });
})();
