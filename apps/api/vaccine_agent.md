- I want to create a vaccine agent that is a sub agent of the task agent, that can research what vaccines user needs given the destinations. 
-Use perplexity to research what vaccines user would need. then, create a task(s) if necessary.  
- tell it to lookup reliable websites like CDC Travelers’ Health (USA) and WHO International Travel & Health 

Example code:

'''
from perplexity import Perplexity

# Initialize the client (uses PERPLEXITY_API_KEY environment variable)
client = Perplexity()

# Make the API call
completion = client.chat.completions.create(
    model="sonar-pro",
    messages=[
        {"role": "user", "content": "What were the results of the 2025 French Open Finals?"}
    ]
)

# Print the AI's response
print(completion.choices[0].message.content)
'''

Raw output example from perplexity:
'''
{
  "id": "66f3900f-e32e-4d59-b677-1a55de188262",
  "model": "sonar-pro",
  "created": 1756485272,
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 315,
    "total_tokens": 327,
    "search_context_size": "low",
    "cost": {
      "input_tokens_cost": 0.0,
      "output_tokens_cost": 0.005,
      "request_cost": 0.006,
      "total_cost": 0.011
    }
  },
  "citations": [
    "https://en.wikipedia.org/wiki/2025_French_Open_%E2%80%93_Men's_singles_final",
    "https://www.espn.com/tennis/scoreboard/tournament/_/eventId/172-2025/competitionType/1",
    "https://www.cbssports.com/tennis/news/2025-french-open-results-schedule-as-jannik-sinner-faces-carlos-alcaraz-coco-gauff-earns-first-title/",
    "https://www.youtube.com/watch?v=jrkwqoI-gEg",
    "https://en.wikipedia.org/wiki/2025_French_Open_%E2%80%93_Men's_singles"
  ],
  "search_results": [
    {
      "title": "2025 French Open – Men's singles final",
      "url": "https://en.wikipedia.org/wiki/2025_French_Open_%E2%80%93_Men's_singles_final",
      "date": "2025-06-08",
      "last_updated": "2025-08-09",
      "snippet": "After 5 hours and 29 minutes of play, Alcaraz defeated Sinner 4–6, 6–7 (4–7) , 6–4, 7–6 (7–3) , 7–6 (10–2) , in the longest French Open final in history."
    },
    {
      "title": "2025 Roland Garros Men's Singles Tennis Live Scores - ESPN",
      "url": "https://www.espn.com/tennis/scoreboard/tournament/_/eventId/172-2025/competitionType/1",
      "date": "2025-06-08",
      "last_updated": "2025-08-29",
      "snippet": "2025 Roland Garros Scores May 18 - June 8, 2025 Court Philippe-Chatrier, Paris, France Men's Singles 2025 Carlos Alcaraz Defending Champion Carlos Alcaraz."
    },
    {
      "title": "2025 French Open: Results, schedule as Jannik Sinner ...",
      "url": "https://www.cbssports.com/tennis/news/2025-french-open-results-schedule-as-jannik-sinner-faces-carlos-alcaraz-coco-gauff-earns-first-title/",
      "date": "2025-06-07",
      "last_updated": "2025-08-29",
      "snippet": "The women's final is on June 7, and the men's final is one day later on June 8. Men's final. (1) Jannik Sinner vs. (2) Carlos Alcaraz -- Sunday, ..."
    },
    {
      "title": "Alcaraz, Gauff Win French Open 2025 | Swiatek, Ruud Fall - YouTube",
      "url": "https://www.youtube.com/watch?v=jrkwqoI-gEg",
      "date": "2025-06-09",
      "last_updated": "2025-08-04",
      "snippet": "We had some big changes in the rankings also. What was your favorite moment? 0:00 | Intro 0:14 | Weekly Results 0:36 | Rise & Fall 1:24 ..."
    },
    {
      "title": "2025 French Open – Men's singles",
      "url": "https://en.wikipedia.org/wiki/2025_French_Open_%E2%80%93_Men's_singles",
      "date": "2025-04-27",
      "last_updated": "2025-08-29",
      "snippet": "Defending champion Carlos Alcaraz defeated Jannik Sinner in the final, 4–6, 6–7, 6–4, 7–6, 7–6 to win the men's singles tennis title at the 2025 French Open. ..."
    }
  ],
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "**Carlos Alcaraz won the 2025 French Open men's singles final, defeating Jannik Sinner 4–6, 6–7(4–7), 6–4, 7–6(7–3), 7–6(10–2), while Coco Gauff won the women's singles title by rallying past Aryna Sabalenka in three sets**[1][3][5][4].\n\nKey details from the finals:\n\n- **Men's Singles:**  \n  - Alcaraz came back from two sets down to win in the longest French Open final ever (5 hours, 29 minutes)[1][5].\n  - He saved three championship points, a record in the Open Era for men's majors[1][5].\n  - This marked his second Roland Garros title and fifth Grand Slam overall[5].\n  - The match was the first French Open singles final decided by a match tiebreak (final set tiebreak introduced in 2022)[1][5].\n\n- **Women's Singles:**  \n  - Coco Gauff defeated Aryna Sabalenka after losing the first set, showcasing a strong comeback[3].\n  - Gauff secured her second Grand Slam (her first was at the 2023 US Open)[3].\n  - The final was played June 7, 2025; Gauff overcame an early deficit to win in three sets[3].\n\nThese finals were historic for their drama, length, and the milestone achievements for both Alcaraz and Gauff."
      },
      "delta": {
        "role": "assistant",
        "content": ""
      }
    }
  ]
}
'''
