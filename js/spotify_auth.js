// var redirect_uri = "http://localhost:5500/main.html";
var redirect_uri = "https://final-project-nicolas.pages.dev/main"
var client_id = "";
var client_secret = "";
scopes = "user-top-read playlist-modify-public playlist-modify-private user-read-private";

const AUTHORIZE = "http://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";

// var access_token = ''
var refresh_token = ''

/** Authorization Guide https://developer.spotify.com/documentation/general/guides/authorization/code-flow/ */


/*
 * Authenticate to get Authorization Code
 * function called when user clicks on button in index.html
 */
function requestAuthorization(){
    let url = AUTHORIZE
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true"; // Auth confirmation
    url += "&scope=" + scopes
    window.location.href = url; // Show Spotify's authorization screen
}


/**
 * Function to control what to display on /main.html
 * - if access_token for Spotify API was retrieved, load contents.
 * - Otherwise, load #noToken
 */
function onPageLoad(){
    // client_id = localStorage.getItem("client_id");
    // client_secret = localStorage.getItem("client_secret");
    if ( window.location.search.length > 0 ){
        handleRedirect();
    }
    else{
        access_token = localStorage.getItem("access_token");
        if ( access_token == null ){
            // window.location.href = "http://localhost:5500/index.html"
            window.location.href = "https://final-project-nicolas.pages.dev/"
        }
        // else {
        //     // we have an access token so present device section
        //     document.getElementById("noToken").style.display = 'block';  
        // }
    }
}

/**
 * Function to handle callback redirects after getting authorization from requestAuthorization() 
 */
function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri); // remove param from url
}

/**
 * Function to parse Auth code from url after requestAuthorization() redirect
 */
function getCode() {
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}


/**
 * Function to fetch Access Token
 * - Sets up body for POST request in callAuthorizationAPI()
 */
function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

/**
 * Refresh Access Token
 * - each Access Token is valid for 1 hour, so if it expires a new access token needs to be
 *   fetched using the refresh_token
 */
function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}


/**
 * Send POST request to get Access Token from Spotify API
 */
function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

/**
 * Handle server response after POST request for Access Token
 */
function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}


/* API CALLS */
/**
 * 
 * @param {*} method : HTTP request type
 * @param {*} url : API endpoint 
 * @param {*} body : headers, data parameters
 * @param {*} callback : redirect
 */
function callAPI(method, url, body, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(body);
    // xhr.onload = callback;  
    console.log(JSON.stringify(xhr.responseText))
    return JSON.stringify(body)


}


/**
 * GET request to get user's top tracks
 * @param {*} time_range : time range for fetching top tracks data (long_term / medium_term / short_term)
 */
function getTopSongs(time_range){
    endpoint = "https://api.spotify.com/v1/me/top/tracks"
    // time_range = "medium_term"

    access_token = localStorage.getItem('access_token');
    // callAPI("GET", endpoint, body, callback)

    let fetch_status;
    let parsedData;
    response = fetch(endpoint+"?" + new URLSearchParams({
        time_range: time_range
    }), {
        method: "GET",
        headers: {
            "Content-type": "application/json",
            'Authorization': 'Bearer ' + access_token
        }
        
    }).then(function (response) {
        fetch_status = response.status;
        return response.json();
    })
    .then(function (json) {
        if (fetch_status == 200) {
            console.log(" - Top Songs fetched successfully - ");
            parsedData = parseSongs(json);
            console.log("parsedData: ", parsedData);

            createList(parsedData, time_range); //create HTML code with list of songs
        }
    })
    .catch(function(error) {
        // catch request errors
        console.log("error: " + error);
    })

}

function createPlaylist (data) {

}

/**
 * Parse songs from getTopSongs() as following json:
 * {
 *  song_name: name of the song,
 *  artist_name: name of the artist,
 *  album: name of the album of the song
 *  image: link to image of album cover,
 *  uri: spotify uri for song
 * }
 */
function parseSongs(data){
    console.log("Parsing songs:");
    obj = [];
    for(i = 0; i<data.items.length; i++) {
        // SONG NAME
        song_name = data.items[i].name;

        // ARTIST NAME
        artist = data.items[i].artists[0];
        artist_name = artist.name;

        //IMAGE
        album = data.items[i].album;
        image = album.images[1].url; // 300 x 300 image

        //URI
        uri = data.items[i].uri;
        obj.push({song_name, artist_name, album, image, uri});
    }

    TOP_SONGS = obj;
    return obj;
}

/**
 * Function to set up top track lists in main for all 3 time_ranges
 */
function createLists() {
    getTopSongs("medium_term");
    getTopSongs("long_term");
    getTopSongs("short_term");
}

/**
 * 
 */
function createList(data, time_range) {
    console.log("creating list");
    console.log(data);
    div_id = "#"+time_range;
    console.log(div_id);

    for(i = 0; i<data.length; i++) {
        var node = document.createElement('li');
        text = data[i].artist_name + " - " + data[i].song_name;
        node.appendChild(document.createElement('img')).src = data[i].image;
        node.appendChild(document.createTextNode(text));
        
        document.querySelector(div_id + " ol").appendChild(node);
    }
}


