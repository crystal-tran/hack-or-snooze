"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    // FIXME: complete this function!
    //change variable name to hostname or return
    const urlLink = new URL(this.url).hostname;
    return urlLink;
    //return new URL(this.url).host
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await fetch(`${BASE_URL}/stories`, {
      method: "GET",
    });
    const storiesData = await response.json();

    // turn plain old story objects from API into instances of Story class
    //stories is an array of story instances
    const stories = storiesData.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    //get the newStory data (object), get the user data (token)
    //console.logs commented out for debugging
    // console.log("user is", user, "newStory is", newStory);
    const userToken = user.loginToken; //retrieve user token
    // console.log("userToken is:", userToken);
    const {title, author, url} = newStory;
    // console.log("title is", title, "author is", author, "url is", url);

    const bodyString = JSON.stringify({
       token: userToken,
       story: {title, author, url}
      });
    //console.log("bodyString is", bodyString);

    const response = await fetch(`${BASE_URL}/stories`,
    {
      method: "POST",
      body: bodyString,
      headers: {
        "content-type" : "application/json"
      }
    });

    const storyDataFromAPI = await response.json();

    //console.log("response is:", response, "story Data is", storyDataFromAPI);

    // StoryList.getStories();

    /* FIXME:
    received an error in the console "Uncaught (in promise)
    TypeError: Cannot destructure property 'storyId' of 'undefined' as it is undefined.
    at new Story (models.js:15:17)
    at StoryList.addStory (models.js:109:12)"*/

    // const aNewStory = new Story(storyData.story);
    // console.log("aNewStory is", aNewStory);
    // aNewStory instanceof Story ? console.log(true) : console.log(false)
    //FIXME: set new Story(storyData.story to a variable and console log it) */
    //console.log("storyData.story =", storyDataFromAPI.story);
    const storyInfo = storyDataFromAPI.story;
    const story = new Story(storyInfo);

    this.stories.unshift(story);

    console.log(storyInfo);
    console.log(this.stories);

    return story;


  }
}

// storyInfo.storyId,storyInfo.title,storyInfo.author,storyInfo.url,
//       storyInfo.username, storyInfo.createdAt

/**
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
    username,
    name,
    createdAt,
    favorites = [],
    ownStories = []
  },
    token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  //in order to use signup method, attach it on the User class
  static async signup(username, password, name) {
    const response = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      body: JSON.stringify({ user: { username, password, name } }),
      headers: {
        "content-type": "application/json",
      }
    });
    const userData = await response.json();
    const { user } = userData;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      userData.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      body: JSON.stringify({ user: { username, password } }),
      headers: {
        "content-type": "application/json",
      }
    });
    const userData = await response.json();
    const { user } = userData;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      userData.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const tokenParams = new URLSearchParams({ token });

      const response = await fetch(
        `${BASE_URL}/users/${username}?${tokenParams}`,
        {
          method: "GET"
        }
      );
      const userData = await response.json();
      const { user } = userData;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }
}
