import numpy as np
import xarray as xr
import requests
from ipyleaflet import Map, basemaps, SearchControl, GeoJSON, WidgetControl, CircleMarker, MarkerCluster
from ipywidgets import Button, Layout, FloatSlider, VBox, Label
from shapely.geometry import shape, Point

# --- 1. Dynamic Wind Data Generation ---
lats, lons = np.linspace(-90, 90, 100), np.linspace(-180, 180, 200)
lon2d, lat2d = np.meshgrid(lons, lats)
u_base = np.cos(np.radians(lat2d)) * 20
v_base = np.sin(np.radians(lat2d)) * 10

ds = xr.Dataset(
    {"u_wind": (("lat", "lon"), u_base.copy()), "v_wind": (("lat", "lon"), v_base.copy())},
    coords={"lat": lats, "lon": lons},
)

# --- 2. Map Initialization ---
m = Map(center=(28.6139, 77.2090), zoom=5, basemap=basemaps.OpenStreetMap.Mapnik, layout=Layout(height='700px'))

# Layer for the points added on click
marker_cluster = MarkerCluster(name="Manual Points")
m.add_layer(marker_cluster)

# --- 3. Boundary Layer & Logic ---
boundary_layer = GeoJSON(
    style={'color': '#FF0000', 'fillColor': '#FF0000', 'opacity': 0.8, 'weight': 3, 'fillOpacity': 0.2},
    name="City Boundary"
)
m.add_layer(boundary_layer)

def on_location_found(change):
    """Handles location selection from SearchControl."""
    # Nominatim returns 'location' as a dict with 'lat', 'lon', etc.
    if change.get('location'):
        loc = change['location']
        # Fetch the polygon specifically for this OSM ID to be faster/more accurate
        search_url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={loc[0]}&lon={loc[1]}&polygon_geojson=1"
        res = requests.get(search_url).json()

        if 'geojson' in res:
            boundary_layer.data = res['geojson']
            m.center = (float(res['lat']), float(res['lon']))
            m.zoom = 11

def handle_map_click(**kwargs):
    """Adds a marker only if the click is inside the boundary."""
    if kwargs.get('type') == 'click' and boundary_layer.data:
        coords = kwargs.get('coordinates')
        point = Point(coords[1], coords[0]) # Shapely uses (x, y)
        polygon = shape(boundary_layer.data)

        if polygon.contains(point):
            marker = CircleMarker(location=coords, radius=5, color="red", fill_color="yellow")
            marker_cluster.add_layer(marker)

m.on_interaction(handle_map_click)

# --- 4. Search & Controls ---
search = SearchControl(
    position="topleft",
    url='https://nominatim.openstreetmap.org/search?format=json&q={s}',
    zoom=12,
    property_name='display_name',
    marker=None
)
search.observe(on_location_found, names='location')
m.add_control(search)

def clear_all(b):
    boundary_layer.data = None
    marker_cluster.clear_layers()

btn = Button(description="Clear All", button_style='danger', icon='trash')
btn.on_click(clear_all)
m.add_control(WidgetControl(widget=btn, position='topright'))

# --- 5. Velocity Layer & Sliders (Keep your original logic) ---
from ipyleaflet.velocity import Velocity
wind_layer = Velocity(
    data=ds, zonal_speed='u_wind', meridional_speed='v_wind',
    latitude_dimension='lat', longitude_dimension='lon',
    velocity_scale=0.01, max_velocity=25,
    color_scale=['#313695', '#4575b4', '#abd9e9', '#f46d43', '#a50026']
)
m.add_layer(wind_layer)

speed_slider = FloatSlider(value=1.0, min=0.1, max=5.0, step=0.1, description="Speed Factor")
direction_slider = FloatSlider(value=0, min=0, max=360, step=1, description="Direction (deg)")

def update_wind(change=None):
    angle = np.radians(direction_slider.value)
    u_rot = (u_base * np.cos(angle) - v_base * np.sin(angle)) * speed_slider.value
    v_rot = (u_base * np.sin(angle) + v_base * np.cos(angle)) * speed_slider.value
    ds['u_wind'][:] = u_rot
    ds['v_wind'][:] = v_rot

speed_slider.observe(update_wind, names='value')
direction_slider.observe(update_wind, names='value')

m.add_control(WidgetControl(widget=VBox([Label("Wind Controls:"), speed_slider, direction_slider]), position='bottomleft'))

m