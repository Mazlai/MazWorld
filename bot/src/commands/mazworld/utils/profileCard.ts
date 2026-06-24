import {
  createCanvas,
  loadImage,
} from 'canvas';
import { AttachmentBuilder } from 'discord.js';

export interface ProfileCardOptions {
  username: string;
  avatarURL: string;
  background: string;
  badges: string[];
  coins: number;
}

const BACKGROUNDS: Record<string, string> = {
  bg_default: '#2f3136',
  default:    '#2f3136',
  bg_blue:    '#5865f2',
  bg_purple:  '#9b59b6',
  bg_green:   '#2ecc71',
  bg_red:     '#e74c3c',
  bg_orange:  '#e67e22',
};

const BADGES: Record<string, string> = {
  badge_founder:  '👑',
  badge_verified: '✅',
  badge_star:     '⭐',
  badge_heart:    '❤️',
  badge_fire:     '🔥',
  badge_diamond:  '💎',
};

export async function generateProfileCard(options: ProfileCardOptions): Promise<AttachmentBuilder> {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  const bgColor = BACKGROUNDS[options.background] || BACKGROUNDS['bg_default'];
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 800, 400);

  const gradient = ctx.createLinearGradient(0, 0, 800, 400);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 400);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.strokeRect(10, 10, 780, 380);

  try {
    const avatar = await loadImage(options.avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 200, 100, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 50, 100, 200, 200);
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(150, 200, 100, 0, Math.PI * 2);
    ctx.stroke();
  } catch {
    ctx.fillStyle = '#7289da';
    ctx.beginPath();
    ctx.arc(150, 200, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(150, 200, 100, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.fillText(options.username, 300, 150);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 180);
  ctx.lineTo(750, 180);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '20px Arial';
  ctx.fillText('Badges', 300, 210);

  for (let i = 0; i < 6; i++) {
    const x = 300 + (i * 80);
    const y = 220;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, 60, 60);
    ctx.strokeRect(x, y, 60, 60);

    const badgeId = options.badges[i];
    if (badgeId) {
      const emoji = BADGES[badgeId];
      if (emoji) {
        ctx.font = '40px Arial';
        ctx.fillStyle = '#ffffff';
        const metrics = ctx.measureText(emoji);
        ctx.fillText(emoji, x + (60 - metrics.width) / 2, y + 60 / 2 + 14);
      } else {
        ctx.font = '30px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const metrics = ctx.measureText('?');
        ctx.fillText('?', x + (60 - metrics.width) / 2, y + 60 / 2 + 10);
      }
    }
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(620, 310, 150, 60);
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
  ctx.lineWidth = 3;
  ctx.strokeRect(620, 310, 150, 60);
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('💰', 630, 350);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`${options.coins}€`, 670, 350);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '16px Arial';
  const bgName = options.background.replace('bg_', '');
  ctx.fillText(`Background: ${bgName.charAt(0).toUpperCase() + bgName.slice(1)}`, 300, 320);
  ctx.fillText(`Badges équipés: ${options.badges.filter(Boolean).length}/6`, 300, 345);

  return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'profile.png' });
}
