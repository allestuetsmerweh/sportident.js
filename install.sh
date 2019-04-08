#!/bin/sh

cat <<EOM >/etc/udev/rules.d/99-sportident.rules
SUBSYSTEM=="usb", ATTRS{idVendor}=="10c4", ATTRS{idProduct}=="800a", MODE="0660", GROUP="plugdev", RUN="/bin/sh -c 'echo -n \$id:1.0 > /sys/bus/usb/drivers/cp210x/unbind'"
EOM
udevadm control --reload
