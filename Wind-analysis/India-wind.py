import numpy as np
import xarray as xr
import requests
from ipywidgets import Button, Layout, FloatSlider, VBox, HBox, Label, HTML
from ipyleaflet import Map, basemaps, SearchControl, GeoJSON, WidgetControl, CircleMarker

# --- FIX: Resilient Velocity Import ---
try:
    from ipyleaflet import Velocity
except ImportError:
    try:
        from ipyleaflet.velocity import Velocity
    except ImportError:
        print("Error: Velocity layer not found. Try running: !pip install ipyleaflet")

# --- 1. Natural Wind Generation (Pressure-Based Flow) ---
def generate_natural_wind(speed_factor=1.0, angle_deg=0):
    lats = np.linspace(-90, 90, 100)
    lons = np.linspace(-180, 180, 200)
    lon2d, lat2d = np.meshgrid(lons, lats)

    # Create a "Pressure Map" with random High/Low systems
    # This makes wind swirl rather than move in straight lines
    pressure = (np.exp(-((lat2d-30)**2 + (lon2d-70)**2)/500) -
                np.exp(-((lat2d-10)**2 + (lon2d-100)**2)/800))

    # Gradient of pressure = Wind direction (simplified)
    v, u = np.gradient(pressure)
    u = u * 500 + 5 # Add a base westerly flow
    v = v * 500

    # Apply Rotation & Speed
    angle_rad = np.radians(angle_deg)
    u_rot = (u * np.cos(angle_rad) - v * np.sin(angle_rad)) * speed_factor
    v_rot = (u * np.sin(angle_rad) + v * np.cos(angle_rad)) * speed_factor

    return xr.Dataset(
        {"u_wind": (("lat", "lon"), u_rot), "v_wind": (("lat", "lon"), v_rot)},
        coords={"lat": lats, "lon": lons},
    )

# --- 2. Map Setup ---
m = Map(
    center=(28.61, 77.20), zoom=4,
    basemap=basemaps.CartoDB.DarkMatter,
    layout=Layout(height='600px', border='2px solid #333', border_radius='10px')
)

# --- 3. Velocity Layer ---
wind_ds = generate_natural_wind()
wind_layer = Velocity(
    data=wind_ds, zonal_speed='u_wind', meridional_speed='v_wind',
    latitude_dimension='lat', longitude_dimension='lon',
    velocity_scale=0.01, max_velocity=40,
    color_scale=['#000033', '#0000ff', '#00ffff', '#ffff00', '#ff0000']
)
m.add_layer(wind_layer)

# --- 4. Modern Sidebar UI ---
title = HTML("<h3 style='color:white; margin:0;'>Wind Control Center</h3>")
speed_slider = FloatSlider(value=1.0, min=0.1, max=4.0, description='Gustiness',
                           style={'description_width': 'initial'}, layout={'width': '200px'})
dir_slider = FloatSlider(value=0, min=0, max=360, description='Heading',
                         style={'description_width': 'initial'}, layout={'width': '200px'})

def update_map(change):
    # To trigger a refresh, we MUST create a new Dataset
    # Modifying the existing one in-place often fails to notify the JS frontend
    wind_layer.data = generate_natural_wind(speed_slider.value, dir_slider.value)

speed_slider.observe(update_map, 'value')
dir_slider.observe(update_map, 'value')

# Styled container for controls
ui_container = VBox([title, speed_slider, dir_slider],
                    layout=Layout(padding='20px', background_color='#222',
                                  border='1px solid #444', opacity='0.9'))

m.add_control(WidgetControl(widget=ui_container, position='bottomleft'))
m