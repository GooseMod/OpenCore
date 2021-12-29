#!/bin/sh

echo "Packing asar..."
asar pack src core.asar

echo "Copying asar..."
cp core.asar ~/.config/discordcanary/0.0.131/modules/discord_desktop_core/core.asar

echo "Running discord..."
echo ""

discord-canary