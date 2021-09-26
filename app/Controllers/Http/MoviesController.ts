import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Comment from 'App/Models/Comment';
import axios from 'axios';

enum sortOrder{
  ASC='asc',
  DESC="desc"
}

export default class MoviesController {
  private api = "https://swapi.dev/api";
  // constructor() {
  //   this.api = api
  // }
  //@ts-ignore
  public async index ({request, response, params}: HttpContextContract) {
    try {
      let movies = await axios.get(`${this.api}/films`);
      let m = movies.data;
      let responseData = m.results.map(doc=>{
        return {
          title:doc.title,
          episode_id:doc.episode_id,
          opening_crawl:doc.opening_crawl,
          release_date:doc.release_date,
          comments:[],
          characters:doc.characters,
          url:doc.url
        }
      });
      let comments = await Comment.all();
      comments.forEach(comm=>{
        for(let m of responseData) {
          if(comm.episode_id == m.episode_id) {
            m.comments.push(comm);
          }
        }
      });
      responseData.sort((a,b)=> b.release_date-a.release_date);
      return response.status(200).json(responseData);
    } catch (error) {
      throw new Error(error)
    }
  }

  public async comment ({request, response, params}: HttpContextContract) {
    try {
      const comment = await Comment.create({
        comment_by:'anonymous',
        comment:request.input('comment'),
        comment_ip:request.ip(),
        episode_id: params.episodeId
      });
      return response.status(200).json(comment);
    } catch (e) {
      throw new Error(e);
    }
  }

  public async fetchCharacters ({request, response}: HttpContextContract) {
    try {
      let page = request.input('page') || 1;
      let sort = request.input('sort_by');
      let filter = request.input('filter');
      let order = request.input('sort_order');
      let data = await(await axios.get(`${this.api}/people?page=${page}`)).data;
      console.log(sort, filter, page, order);
      if(sort) {
        if(order == sortOrder.ASC) {
          if(sort == 'name') {
            data.results.sort((a,b)=> a.name.localeCompare(b.name))
          }else if(sort == 'gender') {
            data.results.sort((a,b)=> a.gender.localeCompare(b.gender))
          }else if(sort == 'height') {
            data.results.sort((a,b)=> a.height-b.height)
          }
        } else if(order == sortOrder.DESC) {
          if(sort == 'name') {
            data.results.sort((a,b)=> b.name.localeCompare(a.name))
          }else if(sort == 'gender') {
            data.results.sort((a,b)=> b.gender.localeCompare(a.gender))
          }else if(sort == 'height') {
            data.results.sort((a,b)=> b.height-a.height)
          }
        }
      }

      if(filter) {
        data.results = data.results.filter(char=> char.gender == filter);
      }

      return response.status(200).json({...data, docs:data.results.length});
    } catch (e) {
      throw new Error(e);
    }
  }

  public async show ({request, response}: HttpContextContract) {
    try {
      let film_id = request.input('film_url');
      let data = await(await axios.get(`${film_id}`)).data;
      // let comments = await Comment.findMany([{episode_id:data.episode_id}])
      // console.log(comments);
      let res = {
        ...data,
        //@ts-ignore
        comments: await (await Comment.findMany([{episode_id:data.episode_id}])).sort((a,b)=> b.createdAt-b.createdAt)
      }
      response.status(200).json({
        film:res
      });
    } catch (e) {
      throw new Error(e);
    }
  }

  public async filmCharacters ({request, response}: HttpContextContract) {
    try {
      let char_id = request.input('char_url');
      let data = await(await axios.get(`${char_id}`)).data;
      response.status(200).json({
        film:data
      });
    } catch (e) {
      throw new Error(e);
    }
  }

  public async edit ({}: HttpContextContract) {
  }

  public async update ({}: HttpContextContract) {
  }

  public async destroy ({}: HttpContextContract) {
  }
}
