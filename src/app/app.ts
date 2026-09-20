import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './services/supabase';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  protected readonly title = signal('cine-app');

  constructor(private supabaseService: Supabase) {

  }

}