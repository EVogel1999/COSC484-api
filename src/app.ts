import { MongoClient } from "mongodb";
import { Datastore } from "./datastore";
import * as express from 'express';
import * as morgan from 'morgan';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { request } from "https";

const bodyParser = require('body-parser');


Datastore
  .connect()
  .then((client: MongoClient) => {
    const ordersDatastore = new Datastore(client);
    startServer(ordersDatastore);
  });

function startServer(datastore: Datastore) {
  const app = express();

  app.use(morgan('dev'));

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Add permissions to access server
  app.use((req, res, next) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'https://example-high-school.firebaseapp.com');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Pass to next layer of middleware
    next();
  });

  const port = process.env.PORT || 3000;
    
  // Routes go here

  // Retrieves a list of all faculty
  app.get('/faculty', async (req: Request, res: Response) => {
    try {
        // Get filter query, if any
        let query;
        if (req.query.departments)
            query = JSON.parse(req.query.departments);
        let result;
        if (query) {
            result = await datastore.filterFaculty(query);
        } else {
            result = await datastore.getAllFaculty();
        }
        res.status(200).send(result);
    } catch (e) {
        res.status(500).send(e);
    }
  });

  // Retrieves a particular faculty member by their id
  app.get('/faculty/:id', async (req: Request, res: Response) => {
    const id: string = req.params.id;
    try {
      const result = await datastore.getFaculty(id);
      if (result !== null) {
        res.status(200).send(result);
      } else {
        res.status(404).send('Could not find faculty');
      }
    } catch (e) {
      res.status(500).send(e);
    }
  });

  // Dynamically gets the list of departments
  app.get('/departments', async (req: Request, res: Response) => {
    try {
      const departments = await datastore.getDepartments();
      res.status(200).send(departments);
    } catch (e) {
      res.status(500).send(e);
    }
  });

  // Creates a new faculty member
  app.post('/faculty', async (req: Request, res: Response) => {
    const auth = req.header('authorization');
    const name = req.body.name;
    const role = req.body.role;
    const email = req.body.email;
    const classes = req.body.classes;
    const department = req.body.department;
    const picture = req.body.picture;
    const website = req.body.website;
    if (!auth) {
      res.status(401).send('You must be logged in');
    } else {
        if (name == '' || role == '' || email == '' ||
        department == '' || picture == '') {
          res.status(400).send('Missing parameter(s) for faculty');
      } else {
        try {
          await datastore.hireFaculty({name: name, role: role, email: email, classes: classes,
            department: department, picture: picture, website: website});
            res.sendStatus(201);
        } catch (e) {
          res.status(500).send(e);
        }
      }
    }
  });

  // Deletes a faculty member by id
  app.delete('/faculty/:id', async (req: Request, res: Response) => {
    const auth = req.header('authorization');
    if (!auth) {
      res.status(401).send('You must be logged in');
    } else {
      try {
        const id = req.params.id;
        const find = await datastore.getFaculty(id);
        if (find == undefined) {
          res.status(404).send('Could not find faculty');
        } else {
          datastore.fireFaculty(id);
          res.sendStatus(204);
        }
      } catch (e) {
        res.status(500).send(e);
      }
    }
  });

  // Updates a faculty member by id
  app.patch('/faculty/:id', async (req: Request, res: Response) => {
    const id = req.params.id;
    const name = req.body.name;
    const role = req.body.role;
    const email = req.body.email;
    const classes = req.body.classes;
    const department = req.body.department;
    const picture = req.body.picture;
    const website = req.body.website;
    const auth = req.header('authorization');
    if (!auth) {
      res.status(401).send('You must be logged in');
    } else {
        if (id == '' || name == '' || role == '' || email == '' ||
        department == '' || picture == '') {
          res.status(400).send('Missing parameter(s) for faculty');
      } else {
        try {
          const find = await datastore.getFaculty(id);
          if (find == undefined) {
            res.status(404).send('Could not find faculty');
          } else {
            datastore.updateFaculty(id, {name: name, role: role, email: email, classes: classes,
              department: department, picture: picture, website: website});
            res.sendStatus(204);
          }
        } catch (e) {
          res.status(500).send(e);
        }
      }
    }
  });
  
  // Gets list of school resources
  app.get('/resources', async (req: Request, res: Response) => {
    try {
      const result = await datastore.getAllResources();
      res.status(200).send(result);
    } catch (e) {
      res.status(500).send(e);
    }
  });

  // Creates a new resource
  app.post('/resource', async (req: Request, res: Response) => {
    const id = req.params.id;
    const name = req.body.name;
    const description = req.body.description;
    const website = req.body.website;
    const auth = req.header('authorization');
    if (!auth) {
      res.status(401).send('You must be logged in');
    } else {
        if (name == '' || description == '' || website == '') {
          res.status(400).send('Missing parameter(s) for resources');
      } else {
        try {
          await datastore.postResource(id, {name: name, description: description, website: website});
          res.sendStatus(201);
        } catch (e) {
          res.status(500).send(e);
        }
      }
    }
  });

  // Gets a school resource by id
  app.get('/resources/:id', async (req: Request, res: Response) => {
    const id: string = req.params.id;
    try {  
      const result = await datastore.getResource(id);
      if (result !== null) {
        res.status(200).send(result);
      } else {
        res.status(404).send('Could not find Resource');
      }
    } catch (e) {
      res.status(500).send(e);
    }
  });

  // Deletes a school resource by id
  app.delete('/resources/:id', async (req: Request, res: Response) => {
    const auth = req.header('authorization');
    if (!auth) {
      res.status(401).send('You must be logged in');
    } else {
      try {
        const id = req.params.id;
        const find = await datastore.getResource(id);
        if (find === undefined) {
          res.status(404).send('Could not find resource');
        } else {
          datastore.removeResource(id);
          res.sendStatus(204);
        }
      } catch (e) {
        res.status(500).send(e);
      }
    }
  });

  // Gets a school news article by id
  app.get('/news/:id', async (req: Request, res: Response) => {
    const id: string = req.params.id;
    try {
      const result = await datastore.getNews(id);
      if (result !== null) {
        res.status(200).send(result);
      } else {
        res.status(404).send('Could not find news article');
      }
    } catch (e) {
      res.status(500).send(e);
    }
  });

  // Gets list of school news
  app.get('/news', async (req: Request, res: Response) => {
    try {
      const result = await datastore.getAllNews();
      if (result !== null) {
        res.status(200).send(result);
      } else {
        res.status(404).send('No News Here');
      }
    } catch (e) {
      res.status(500).send(e);
    }
  });
 
  // Creates new school news article
  app.post('/news', async (req: Request, res: Response) => {
    const id = req.params.id;
    const title = req.body.title;
    const date = req.body.date;
    const description = req.body.description;
    const image = req.body.image;
    const body = req.body.body;
    const auth = req.header('authorization');
    if (!auth) {
      res.status(401).send('You must be logged in');
    } else {
      if (title == '' || description == '' || image == '' || date == '' || body == '') {
        res.status(400).send('Missing parameter(s) for article');
      } else { 
        try {
          await datastore.postNews(id, {title: title,date:date, description: description, image: image,body:body});
          res.sendStatus(201);
        } catch (e) {
          res.status(500).send(e);
        }
      }
    }
  });

  // Updates a school news article
  app.patch('/news/:id', async (req: Request, res: Response) => {
    const auth = req.header('authorization');
    if (!auth) {
      res.status(401).send('You must be logged in');
    } else {
      try {
        const id = req.params.id;
        const find = await datastore.getNews(id);
        if (find === undefined) {
          res.status(404).send('Could not find Articles');
        } else {
          const params = {
            title: req.body.title,
            date: req.body.date,
            description: req.body.description,
            image: req.body.image,
            body: req.body.body
          };
          if (params.title == '' || params.date == '' || params.image == '' || params.description == '' || params.body == '') {
            res.status(400).send('Missing parameter(s) for article');
          } else {
            await datastore.patchNews(id, params);
            res.sendStatus(204);
          }
        }
      } catch (e) {
        res.status(500).send(e);
      }
    }
  });

  // Deletes a school news article
  app.delete('/news/:id', async (req: Request, res: Response) => {
    const auth = req.header('authorization');
    if (!auth) {
      res.status(401).send('You must be logged in');
    } else {
      try {
        const id = req.params.id;
        const find = await datastore.getNews(id);
        if (find === undefined) {
          res.status(404).send('Could not find Articles');
        } else {
          await datastore.deleteNews(id);
          res.sendStatus(204);
        }
      } catch (e) {
        res.status(500).send(e);
      }
    }
  });

  //Retrieves each and every athlete from the database
  app.get('/athletes', async (req: Request, res: Response) => {
    try {
        // Get filter query, if any
        let query;
        if (req.query.sports)
            query = JSON.parse(req.query.sports);
        let result;
        if (query) {
            result = await datastore.filterAthletes(query);
        } else {
            result = await datastore.getAllAthletes();
        }
        res.status(200).send(result);
    } catch (e) {
        res.status(500).send(e);
    }
  });

  //Retrieves a single athlete via ID
  app.get('/athletes/:id', async (req: Request, res: Response) => {
    const id: string = req.params.id;
    try {
      const result = await datastore.getFaculty(id);
      if (result !== null) {
        res.status(200).send(result);
      } else {
        res.status(404).send('Could not find faculty');
      }
      } catch (e) {
        res.status(500).send(e);
      }
  });

  //Retrieves all sport categories
  app.get('/sports', async (req: Request, res: Response) => {
    try {
        const sports = await datastore.getSports();
        res.status(200).send(sports);
    } catch (e) {
        res.status(500).send(e);
    }
  });

  //Allows for the creation of a new athlete
  app.post('/athletes', async (req: Request, res: Response) => {
    const name = req.body.name;
    const sport = req.body.sport;
    const description = req.body.description;
    const picture = req.body.picture;
    const website = req.body.website;
    const auth = req.header('authorization');
    if (!auth) {
      res.status(401).send('You must be signed in');
    } else {
      if (name == '' || sport == '' || description == '' || picture == '')
      {
         res.status(400).send('Missing parameter(s) for athletes');
      } else {
        try {
          await datastore.addAthletes({name: name, sport: sport, description: description,
            picture: picture, website: website});
          res.sendStatus(201);
        } catch (e) {
          res.status(500).send(e);
       }
      }
    }
  });
 
  //Deletes a single athlete via ID
  app.delete('/athletes/:id', async (req: Request, res: Response) => {
    const auth = req.header('authorization');
    if (!auth) {
      res.status(401).send('You must be logged in');
    } else {
      try {
        const id = req.params.id;
        const find = await datastore.getAthletes(id);
        if (find == undefined) {
          res.status(404).send('Could not find athletes for deletion');
        } else {
          datastore.removeAthletes(id);
          res.sendStatus(204);
        }
      } catch (e) {
        res.status(500).send(e);
      }
    }
  });

  // Gets a list of events happening at the school
  app.get('/events', async (req: Request, res: Response) => {
    try {
      const result = await datastore.getSomeEvents();
      if (result !== null) {
        res.status(200).send(result);
      } else {
        res.status(404).send('Could not find event');
      const myResult = await datastore.getAllEvents();
      res.status(200).send(myResult);
    }
   } catch (e) {
      res.status(500).send(e);
    }
  });

  app.post('/login', async (req: Request, res: Response) => {
    let userData = req.body;
    try {
      const user = await datastore.getUserByUsername(userData.username);
      if( user == undefined) {
        res.status(404).send('Username not found');
      } else if (user.password !== userData.password) {
        res.status(401).send('Invalid password');
      } else {
        const payload = {subject: user._id};
        const token = jwt.sign(payload, 'secretKey');
        user.token = token;
        res.status(200).send(user);
      }
    } catch(e) {
      res.status(500).send(e);
    }
  });

  app.get('/photos', async (req: Request, res: Response) => {
    try {
        const photos = await datastore.getAllPhotos();
        res.status(200).send(photos);
    } catch (e) {
        res.status(500).send(e);
    }
  });
  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}