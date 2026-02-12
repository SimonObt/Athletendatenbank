#!/bin/bash
cd /home/simon/.openclaw/workspace/projects/athletendatenbank
echo "Starte Athletendatenbank auf Port 3002..."
npx next dev -p 3002 -H 0.0.0.0
