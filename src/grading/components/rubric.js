export const rubric = [
    {
        "id":"correctness",
        "type":"radio",
        "maxPoints":5,
        "label":"Correctness",
        "options": [
           
          {
            "value":"answer-correct",
            "label":"Correct",
            "keyCode":'Digit1',
            "points":0
          },
          {
            "value":"answer-minor-error",
            "label":"Minor error, such as forgetting one step",
            "keyCode":"Digit2",
            "points":1
          },
          {
            "value":"answer-major-error",
            "label":"Major issue",
            "keyCode":"Digit3",
            "points":3
          },
          {
            "value":"answer-incorrect",
            "label":"No answer or incorrect",
            "keyCode":"Digit4",
            "points":5
          }
        ]
      },
      {
        "id":"style",
        "type":"radio",
        "maxPoints":2,
        "label":"Style",
        "options": [
         
          {
            "value":"correct-style",
            "label":"Sufficiently clear",
            "points":0,
            "keyCode":"Digit7"
          },
          {
            "value":"style-underspecified", 
            "label":"Minor style issue",
            "points":1,
            "keyCode":"Digit8"
          },
          {
            "value":"style-major-issue",
            "label":"Major issue, or no explanation",
            "points":2,
            "keyCode":"Digit9"
          }
        ]
      }
]

//git commit -m "added rubric for grading"