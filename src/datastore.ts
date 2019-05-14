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
  
  static async connect() {
    return new Promise<MongoClient>((resolve, reject) =>
      MongoClient.connect(URL, async (err: Error, client: MongoClient) => {
        if (err) {
          reject(err);
        }
        resolve(client);
      }));
  }

  async getAllFaculty() {
    return await this.school.collection('faculty').find({}).toArray();
  }

  async getAllSports() {
    return await this.school.collection('athletes').find({}).toArray();
  }

  async getAllEvents() {
    return await this.school.collection('events').find({}).toArray();
  }

  async filterFaculty(departments: string[]) {
    return await this.school.collection('faculty').find({ department: { $in: departments }}).toArray();
  }

  async getFaculty(id: string) {
    return await this.school.collection('faculty').findOne({ _id: new ObjectId(id) });
  }

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

  async fireFaculty(id: string) {
    await this.school.collection('faculty').deleteOne({ _id: new ObjectId(id) });
  }

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

  async getAllNews() {
    return await this.school.collection('news').find({}).toArray();
  }

  async getNews(id: string) {
    return await this.school.collection('news').findOne({ _id: new ObjectId(id) })
  }

  async deleteNews(id: string){
    await this.school.collection('news').deleteOne({ _id: new ObjectId(id) });
  }

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
      
      async getSomeNews(){
        return await this.school.collection('news').find({}).limit(2).toArray();
      }

      async getSomeEvents(){
        return await this.school.collection('events').find({}).limit(2).toArray();
      }
  
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

  async getAllResources()
  {
    return await this.school.collection('resources').find({}).toArray();
  } 

  async getResource(id:string)
  {
    return await this.school.collection('resources').findOne({ _id: new ObjectId(id) });
  }

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


  async removeResource(id:string){
    await this.school.collection('resources').deleteOne({ _id: new ObjectId(id) });
  }
  
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

  async getAthletes(id: string) {
    return await this.school.collection('athletes').findOne({ _id: new ObjectId(id) });
  }

  async getAllAthletes() {
    return await this.school.collection('athletes').find({}).toArray();
  }

  async addAthletes(params:
    { name: string,
      sport: string[],
      description: string,
      picture: string,
      website?:string}) {
        await this.school.collection('athletes').insertOne(params);
  }

  async removeAthletes(id: string) {
    await this.school.collection('athletes').deleteOne({ _id: new ObjectId(id) });
  }

  async filterAthletes(sports: string[]) {
    return await this.school.collection('athletes').find({ sport: { $in: sports }}).toArray();
  }
}
