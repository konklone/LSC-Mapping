var pip = require('geojson-utils');
var map = L.mapbox.map('map', 'tmcw.map-oitj0si5')
    .setView([40, -74.50], 9);

var fl = L.geoJson().addTo(map);

$.ajax({
    url: 'master.json',
    success: function(master) {
        $.ajax({
            url: 'index.json',
            success: function(dat) {
                $('#fm').on('submit', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    $.ajax('http://api.tiles.mapbox.com/v3/tmcw.map-jcq5zhdm/geocode/' +
                      encodeURIComponent($('#address').val()) + '.json').done(function(res) {
                          if (res.results && res.results[0] && res.results[0][0]) {
                              var areas = findLocation(dat, res.results[0][0]);
                              if (areas.length) loadResults(res.results[0][0], areas, master);
                          }
                      });
                    return false;
                });
            }
        });
    }
});

function findLocation(index, ll) {

    var results = [];

    for (var i = 0; i < index.length; i++) {

        if (ll.lon > index[i][0] &&
            ll.lon < index[i][2] &&

            ll.lat > index[i][1] &&
            ll.lat < index[i][3]) {

            results.push(index[i]);

        }

    }

    return results;
}

function loadResult(r, cb) {
    $.getJSON('areas/' + r[4] + '.geojson').done(function(d) {
        cb(null, d);
    });
}

var q = queue(1);

function loadResults(center, results, list) {

    results.forEach(function(r) {
        q.defer(loadResult, r);
    });

    q.awaitAll(function(err, results) {

        var res = results.filter(function(r) {
            return gju.pointInPolygon({
                type: 'Point',
                coordinates: [center.lon, center.lat]
            }, r.geometry);
        })[0];

        if (!res) return alert('No location found');

        fl.clearLayers();
        fl.addData(res);
        fl.addData({ type: 'Point', coordinates: [center.lon, center.lat] });
        map.fitBounds(fl.getBounds());

        var $info = $('#info')
            .html(res.properties.Description);
        var rno = $($('#info td')[1]).text().trim();

        for (var i = 0; i < list.length; i++) {

            if (list[i].Org_ID == rno) {
                for (var k in list[i]) {
                    $('<strong></strong>')
                        .text(k + ': ')
                        .appendTo($info);
                    $('<span></span>')
                        .text(list[i][k])
                        .appendTo($info);
                    $('<br />')
                        .appendTo($info);
                }
            }
        }
    });
}
