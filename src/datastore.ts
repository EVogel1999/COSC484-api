import { MongoClient, ObjectId, Db } from 'mongodb';
import * as dotenv from 'dotenv';
import bodyParser = require('body-parser');
dotenv.config();

const URL = process.env.MONGO_CONNECTION || '';

export class Datastore {
  school: Db;

  constructor(client: MongoClient) {
    this.school = client.db('school');
  }
  
  // Connects to the datbase
  static async connect() {
    return new Promise<MongoClient>((resolve, reject) =>
      MongoClient.connect(URL, { useNewUrlParser: true }, async (err: Error, client: MongoClient) => {
        if (err) {
          reject(err);
        }
        resolve(client);
      }));
  }

  // Retrieves a list of all faculty
  async getAllFaculty() {
    return await this.school.collection('faculty').find({}).toArray();
  }

  // Retrieves a list of all sports
  async getAllSports() {
    return await this.school.collection('athletes').find({}).toArray();
  }

  // Retrieves a list of all events
  async getAllEvents() {
    return await this.school.collection('events').find({}).toArray();
  }

  // Retrieves a filtered list of faculty
  async filterFaculty(departments: string[]) {
    return await this.school.collection('faculty').find({ department: { $in: departments }}).toArray();
  }

  // Retrieves a single faculty member by id
  async getFaculty(id: string) {
    return await this.school.collection('faculty').findOne({ _id: new ObjectId(id) });
  }

  async getUserByUsername(name: string) {
    return await this.school.collection('users').findOne({username: name});
  }
  
  // Creates a new faculty in the database
  async hireFaculty(params:
    { name: string,
      role: string,
      email: string,
      classes: string[],
      department: string[],
      picture: string,
      website?:string}) {
        await this.school.collection('faculty').insertOne(params);
  }

  // Deletes a faculty by id from the database
  async fireFaculty(id: string) {
    await this.school.collection('faculty').deleteOne({ _id: new ObjectId(id) });
  }

  // Updates a faculty member in the database
  async updateFaculty(id: string, params:
    { name: string,
      role: string,
      email: string,
      classes: string[],
      department: string[],
      picture: string,
      website?:string}) {
        await this.school.collection('faculty').findOneAndUpdate({ _id: new ObjectId(id) },
          { $set: {
            "name": params.name,
            "role": params.role,
            "email": params.email,
            "classes": params.classes,
            "department": params.department,
            "picture": params.picture,
            "website": params.website
          }});
  }

  // Retrieves a list of news
  async getAllNews() {
    return await this.school.collection('news').find({}).toArray();
  }

  // Retrieves a single news article by id
  async getNews(id: string) {
    return await this.school.collection('news').findOne({ _id: new ObjectId(id) })
  }

  // Deletes a single news article by id
  async deleteNews(id: string){
    await this.school.collection('news').deleteOne({ _id: new ObjectId(id) });
  }

  // Creates a new news article
  async postNews(id:string, params:
    {
      title:string
      date:string
      description:string
      image:string
      body:string
    }) {
      await this.school.collection('news').insertOne(params);
  }
  
  // Gets recent news articles for homepage
  async getSomeNews(){
    return await this.school.collection('news').find({}).limit(2).toArray();
  }

  // Gets recent events for homepage
  async getSomeEvents(){
    return await this.school.collection('events').find({}).limit(2).toArray();
  }
  
  // Update a news article
  async patchNews(id: string, params: {
    title: string,
    date: string,
    description: string,
    image: string,
    body: string
  }) {
      await this.school.collection('news').updateOne({ _id: new ObjectId(id) },
      {
        $set: {
          "title": params.title,
          "date": params.date,
          "description": params.description,
          "image": params.image,
          "body": params.body
        }
      });
  }

  // Get list of all resources
  async getAllResources()
  {
    return await this.school.collection('resources').find({}).toArray();
  } 

  // Get single resource by id
  async getResource(id:string)
  {
    return await this.school.collection('resources').findOne({ _id: new ObjectId(id) });
  }

  // Update resource by id
  async postResource(id: string, params:
    { name: string,
      description: string,
      website?:string}) {
        await this.school.collection('resources').findOneAndUpdate({_id: new ObjectId(id)},
          { $set: {
            "name": params.name,
            "description": params.description,
            "website": params.website
          }});
  }

  // Delete resource by id
  async removeResource(id:string){
    await this.school.collection('resources').deleteOne({ _id: new ObjectId(id) });
  }
  
  // Get a list of departments to filter by
  async getDepartments() {
    const faculty = await this.getAllFaculty();
    const departments: string[] = [];
    faculty.forEach(f => {
      f.department.forEach((d: string) => {
        if (-1 === departments.indexOf(d)) {
          departments.push(d);
        }
      });
    });
    return departments;
  }

  // Get a list of sports to filter by
  async getSports() {
    const athletes = await this.getAllAthletes();
    const sports: string[] = [];
    athletes.forEach(a => {
      a.sport.forEach((sp: string) => {
        if (-1 === sports.indexOf(sp)) {
          sports.push(sp);
        }
      });
    });
    return sports;
  }

  // Get athlete by id
  async getAthletes(id: string) {
    return await this.school.collection('athletes').findOne({ _id: new ObjectId(id) });
  }

  // Get list of all athletes
  async getAllAthletes() {
    return await this.school.collection('athletes').find({}).toArray();
  }

  // Add athlete to the database
  async addAthletes(params:
    { name: string,
      sport: string[],
      description: string,
      picture: string,
      website?:string}) {
        await this.school.collection('athletes').insertOne(params);
  }

  // Delete athlete from the database
  async removeAthletes(id: string) {
    await this.school.collection('athletes').deleteOne({ _id: new ObjectId(id) });
  }

  // Retrieve a filtered list of athletes
  async filterAthletes(sports: string[]) {
    return await this.school.collection('athletes').find({ sport: { $in: sports }}).toArray();
  }
}
  
