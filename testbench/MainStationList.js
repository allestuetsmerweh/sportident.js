import React from 'react';
import PropTypes from 'prop-types';

export const MainStationList = (props) => (
    <div>
        <div id='si-device-list'>
            {props.devices.map((device) => {
                const isSelected = device.ident === (props.selectedDevice && props.selectedDevice.ident);
                return (
                    <div
                        onClick={() => {
                            window.location.hash = `#${device.ident}`;
                        }}
                        className={`si-device-list-item${isSelected ? ' selected' : ''}`}
                        key={device.ident}
                    >
                        {device.name}
                    </div>
                );
            })}
        </div>
        <button
            id='si-device-add'
            onClick={() => props.addNewDevice()}
        >
            {'New SI Main Station'}
        </button>
    </div>
);
MainStationList.propTypes = {
    devices: PropTypes.array,
    selectedDevice: PropTypes.object,
    addNewDevice: PropTypes.func,
};
