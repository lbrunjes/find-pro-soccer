using System;
using System.Text.RegularExpressions;

namespace Tools
{
	public class SocialMediaScanner
	{
		Regex LinkToTwitter = new Regex (@"href=""http[s]{0,1}://(?:www\.){0,1}twitter.com/(.+?)[/?""]");
		Regex LinkToFacebook = new Regex (@"href=""http[s]{0,1}://(?:www\.){0,1}facebook.com/(.+?)[/?""]");
		Regex LinkToInstagram = new Regex (@"href=""http[s]{0,1}://(?:www\.){0,1}instagram.com/(.+?)[/?""]");
		Regex LinkToYoutube = new Regex (@"href=""http[s]{0,1}://(?:www\.){0,1}youtube.com.com/(.+?)[?""]");
		

		public static void ScanSite(string url){

		}
	}
}

