(() => {
    const SCRIPT_ID = 'CDCalExport';
    const START_DATE_INPUT = 'Anfangsdatum';
    const END_DATE_INPUT = 'Enddatum';

    // sets the data attributes of the script tag so we can use the data in the content script
    // user and hash are global variables on the site ¯\_(ツ)_/¯
    const setDataAttributes = () => {
        // eslint-disable-next-line no-undef
        document.currentScript.setAttribute('data-user', user);
        // eslint-disable-next-line no-undef
        document.currentScript.setAttribute('data-hash', hash);
    };


    // inject script into the page to retrieve the global variables user and hash
    const injectScript = (code) => {
        const script = document.createElement('script');
        script.setAttribute('id', SCRIPT_ID);
        script.appendChild(document.createTextNode(`( ${code} )();`));
        (document.body || document.head || document.documentElement).appendChild(script);

        return Promise.resolve();
    };


    const getDataAttribute = (attributeName) => {
        const scriptNode = document.querySelector(`#${SCRIPT_ID}`);
        const attributeValue = scriptNode.getAttribute(`data-${attributeName}`);

        return attributeValue;
    };


    const formatDateTime = (date, utc) => {
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
    };


    const createDownloadButton = (text, buttonFunction) => {
        const button = document.createElement('a');
        button.setAttribute('class', SCRIPT_ID);
        button.download = 'BA-Kalender.ics';
        button.textContent = text;
        button.onclick = buttonFunction;

        return button;
    };

    const createDateInput = (labelText) => {
        const id = labelText.split(' ').join('');
        const input = document.createElement('input');
        input.setAttribute('class', SCRIPT_ID);
        input.type = 'date';
        input.id = id;
        input.valueAsDate = new Date();

        const label = createDateLabel(id, labelText);

        const container = document.createElement('div');
        container.setAttribute('class', SCRIPT_ID);
        container.appendChild(label);
        container.appendChild(input);
        return container;
    };

    const createDateLabel = (id, labelText) => {
        const label = document.createElement('label');
        label.setAttribute('class', SCRIPT_ID);
        label.textContent = labelText;
        label.setAttribute('for', id);

        return label;
    };


    const getEvents = (user, hash, start, end) => {
        const base = 'https://selfservice.campus-dual.de/room/json';

        const url = `${base}?userid=${user}&hash=${hash}&start=${start}&end=${end}`;

        return fetch(url).then(success => success.json());
    };


    const buildICalEvent = (event) => {
        const iCalEvent = [
            `BEGIN:VEVENT`,
            `DTSTAMP:${formatDateTime(new Date(), true)}`,
            `UID:${event.title}${event.start + event.end}`,
            `SUMMARY:${event.title} | ${event.room} | ${event.instructor}`,
            `LOCATION:${event.room}`,
            `DTSTART:${formatDateTime(event.start, false)}`,
            `DTEND:${formatDateTime(event.end, false)}`,
            `END:VEVENT\n`,
        ].join('\n');

        return iCalEvent;
    };


    const generateCalString = (events) => {
        const start = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:Campus-Dual-Calendar-Export\nX-WR-CALNAME:BA-Dresden\nX-WR-TIMEZONE:Europe/Berlin\n';
        const end = 'END:VCALENDAR';

        let eventstring = '';
        events.forEach((event) => { eventstring += buildICalEvent(event); });

        const calstring = start + eventstring + end;

        return calstring;
    };


    const generateDownloadLink = (calendarString) => {
        const downloadLink = document.createElement('a');
        downloadLink.download = 'BA-Kalender.ics';
        downloadLink.setAttribute('style', 'display:hidden;');

        const calblob = new Blob([calendarString], { type: 'text/calendar;charset=UTF-8' });
        const url = window.URL.createObjectURL(calblob);

        downloadLink.href = url;

        const calendarElement = document.getElementById('calendar');

        calendar.appendChild(downloadLink);

        downloadLink.click();

        calendar.removeChild(downloadLink);
    };


    const setDownloadLink = (clickEvent) => {
        const button = clickEvent.target;
        button.text = 'es lädt';

        startDateInput = document.getElementById(START_DATE_INPUT.split(' ').join(''));
        endDateInput = document.getElementById(END_DATE_INPUT.split(' ').join(''));

        getEvents(
            getDataAttribute('user'),
            getDataAttribute('hash'),
            Math.round( startDateInput.valueAsNumber / 1000 ),
            Math.round( endDateInput.valueAsNumber / 1000 ),
        ).then(events => generateCalString(events)).then(generateDownloadLink).then(() => {
            button.text = 'Fertig. Wenn ihr noch Downloadwünsche habt, ruft sie einfach. Lad die selbe Datei nochmal. Alles klar, die selbe Datei. Und los!';
        });
    };

	const alertAboUrl = (clickevent) => {
		alert('https://cdical.mattishub.xyz/json_to_ical.php?user=' + getDataAttribute('user') + "&hash=" + getDataAttribute('hash'));
    }

    /// Main

    const calendar = document.getElementById('calendar');

    injectScript(setDataAttributes).then(() => {
        const button = createDownloadButton('Kalender herunterladen', setDownloadLink);
        const startDateInput = createDateInput(START_DATE_INPUT);
        const endDateInput = createDateInput(END_DATE_INPUT);
        const aboBtn = createDownloadButton('Abo-URL anzeigen', alertAboUrl);

        calendar.appendChild(startDateInput);
        calendar.appendChild(endDateInput);

        calendar.appendChild(button);
        calendar.appendChild(aboBtn);
    });
})();
