import { Client, EmbedBuilder, ChannelType, TextChannel, Guild } from "discord.js";

export default function guildMessages(bot: Client): void {
  bot.on("guildCreate", (guild: Guild) => {
    const welcomeEmbed = new EmbedBuilder()
      .setTitle("*MazWorld - En développement.*")
      .setColor("#B4ADAB")
      .setURL("https://github.com/Mazlai/MazWorld")
      .setAuthor({
        name: "Mazlai | マイ",
        iconURL: "https://i.pinimg.com/564x/a7/26/5c/a7265ce5384476970886fd1ded1807bb.jpg",
      })
      .setImage("https://i.pinimg.com/originals/b3/23/24/b32324e66163f6d64dc59d9e9bc10f89.gif")
      .setDescription(
        "*Bonjour, merci de m'avoir accepté sur votre serveur !* \n*Vous pourrez retrouver l'ensemble des fonctionnalités de ce bot en utilisant la commande* **/help.**"
      )
      .setTimestamp()
      .setFooter({
        text: "Embed by MazWorld",
        iconURL: "https://i.pinimg.com/564x/4d/73/9f/4d739fa55c3465cadc171fdcc75c01d9.jpg",
      });

    const systemChannel = guild.systemChannel;

    if (systemChannel && systemChannel.type === ChannelType.GuildText) {
      (systemChannel as TextChannel).send({ embeds: [welcomeEmbed] }).catch(console.error);
    }
  });
}
