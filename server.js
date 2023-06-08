const express = require('express');
const fetch = require('node-fetch').default;
const fs = require('fs');
const download = require('image-downloader');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/scrape-assets', (req, res) => {
  const username = req.body.username;
  const limit = req.body.limit || 50;

  if (!username) {
    return res.render('index', { error: 'Username is required.' });
  }

  if (!fs.existsSync('./funged')) {
    fs.mkdirSync('./funged');
  }

  const path = `./funged/${username}/`;
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }

  fetch(`https://api.opensea.io/api/v1/assets?collection=${username}&format=json&limit=${limit}`, {
    headers: {
      'X-Forwarded': '127.0.0.1',
      'User-Agent': 'Mozilla/5.0',
      'content-type': 'application/json'
    }
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Network response was not OK.');
    })
    .then(json => {
      if (!json || !json.assets || json.assets.length < 1) {
        return res.render('index', { error: 'The provided user has no assets in their collection to scrape.' });
      }

      console.log('User has assets in collection. Scraping...');
      json.assets.forEach(asset => {
        if (asset && asset.image_url && asset.image_url.length > 0) {
          fungeTheToken({
            url: asset.image_url,
            dest: `../../${path}/`
          });
        }
      });

      res.render('index', { message: 'Assets scraped successfully.' });
    })
    .catch(error => {
      res.render('index', { error: 'An error occurred while scraping assets.' });
    });
});

const fungeTheToken = async (options) => {
  download.image(options)
    .then(({ filename }) => {
      console.log('Saved to', filename); // saved to /path/to/dest/image.jpg
    })
    .catch((err) => console.error(err));
};

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
