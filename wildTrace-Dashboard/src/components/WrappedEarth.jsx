import { ImageOverlay } from "react-leaflet";


// util: 3x3 overlays qui se répètent en longitudes et latitudes
const LON_OFFSETS = [-360, 0, 360];
const LAT_OFFSETS = [-180, 0, 180];

export default function WrappedEarth({ url, opacity = 1, zIndex = 100 }) {
    return LAT_OFFSETS.flatMap(latShift =>
        LON_OFFSETS.map(lonShift => (
            <ImageOverlay
                key={`${latShift}_${lonShift}`}
                url={url}
                bounds={[
                    [-90 + latShift, -180 + lonShift],
                    [ 90 + latShift,  180 + lonShift],
                ]}
                opacity={opacity}
                zIndex={zIndex}
                interactive={false}
            />
        ))
    );
}
