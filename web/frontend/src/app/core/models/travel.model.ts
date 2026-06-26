export interface City {
  city_id: string;
  name: string;
  description?: string;
  emoji?: string;
  theme?: string;
  position_x: number;
  position_y: number;
}

export interface RouteData {
  route_id: number;
  city_from: string;
  city_to: string;
  from_name: string;
  from_emoji: string;
  to_name: string;
  to_emoji: string;
  cost: number;
  duration: number;
}

export interface TravelRoute {
  route_id: number;
  city_to: string;
  destination_name: string;
  destination_emoji: string;
  cost: number;
  duration: number;
  visited: boolean;
  effective_cost: number;
}

export interface CityJob {
  job_id: number;
  job_name: string;
  job_emoji: string;
  task_1: string;
  task_2: string;
  task_3: string;
}

export interface TravelMapData {
  current_city: {
    city_id: string;
    name: string;
    description: string;
    emoji: string;
    theme: string;
  };
  coins: number;
  routes: TravelRoute[];
  jobs: CityJob[];
}

export interface TravelStatus {
  traveling: boolean;
  destination?: string;
  destination_name?: string;
  destination_emoji?: string;
  arrival_time?: number;
}

export interface TravelStartResult {
  success: boolean;
  message: string;
  arrival_time?: number;
  travel_cost?: number;
  coins?: number;
}

export interface VisualRoute {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
