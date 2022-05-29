<template>
  <div>
    <h2>Týmovač</h2>
    <form @submit.prevent="newPerson">
      <input
        type="text"
        placeholder="Přidat člověka"
        v-model="newName"
      />
      <input
        type="submit"
        value="+ 😎"
        title="Přidat člověka"
      />
    </form>
    <form
      @submit.prevent="newTeam"
      style="padding-bottom:10px"
    >
      <input
        type="text"
        placeholder="Přidat tým"
        v-model="newTeamName"
      />
      <input
        title="Přidat tým"
        type="submit"
        value="+ 🧑‍🤝‍🧑"
      />
    </form>
    <div class="teams">
      <div
        v-for="(team, indexT) in teams"
        :key="`t${indexT}`"
        @drop="onDropTeam($event, indexT)"
        @dragover.prevent
        @dragenter.prevent
      >
        <h3>{{team.name}} <button
            v-if="teams.length>1"
            @click="teams.splice(indexT, 1); save()"
          >🗑</button></h3>
        <div
          :class="{
            person:true,
            friends: (person.friends?.length ?? 0) > 0
          }"
          v-for="(person, indexP) in team.people"
          :key="`p${indexT}${indexP}${person.name}`"
          draggable="true"
          @dragstart="startDrag($event, indexT, indexP)"
          @drop="onDropPerson($event, indexT, indexP)"
          @dragover.prevent
          @dragenter.prevent
        >
          <img
            src="person.svg"
            alt="Osoba"
          />
          <span>{{person.name}}</span>&ensp;
          <button @click="removePerson(indexT, indexP)">🗑</button>
          <br>
          <div v-if="person.friends">
            <div
              class="person"
              v-for="(friend, indexF) in person.friends"
              :key="`f${indexT}${indexP}${indexF}${friend.name}`"
              draggable="true"
              @dragstart="startDrag($event, indexT, indexP, indexF)"
            >
              &gt;
              <img
                src="person.svg"
                alt="Osoba"
              />
              <span>{{friend.name}}</span>&ensp;
              <button @click="removePerson(indexT, indexP, indexF)">🗑</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    {{error}}
  </div>
</template>

<script>
import '~/style.scss'

export default {
  data() {
    return {
      dragging: false,
      error: '',
      newName: '',
      newTeamName: '',
      teams: [
        {
          name: 'Skupinka 1',
          people: []
        }
      ],
    }
  },
  mounted() {
    this.load();
  },
  methods: {
    newPerson() {
      this.teams[0].people.push(
        {
          name: this.newName,
          friends: []
        }
      );
      this.newName = '';//reset

      this.save();
    },
    newTeam() {
      this.teams.push(
        {
          name: this.newTeamName,
          people: []
        }
      );
      this.newTeamName = '';//reset

      this.save();
    },
    save() {
      localStorage.teams = JSON.stringify(this.teams);
    },
    load() {
      if (localStorage.teams) {
        var parsed;
        try {
          parsed = JSON.parse(localStorage.teams)
        }
        catch (e) {
          this.error = e;
        }
        this.teams = parsed || this.teams;
      }
    },
    removePerson(indexT, indexP, indexF) {
      if (indexF) {
        this.teams[indexT].people[indexP].friends.splice(indexF, 1);
      }
      else {
        this.teams[indexT].people.splice(indexP, 1);
      }
      this.save();
    },
    startDrag(evt, indexT, indexP, indexF) {
      if (!this.dragging) {
        this.dragging = true;
        evt.dataTransfer.dropEffect = 'move'
        evt.dataTransfer.effectAllowed = 'move'
        evt.dataTransfer.setData('indexes', JSON.stringify(
          {
            draggedT: indexT,
            draggedP: indexP,
            draggedF: indexF
          }
        ));
      }
      else {

      }
    },
    onDropPerson(evt, indexT, indexP) {
      this.dragging = false;
      const { draggedT, draggedP, draggedF } = JSON.parse(
        evt.dataTransfer.getData('indexes')
      );

      var draggedPerson = this.teams[draggedT].people[draggedP];

      if (typeof draggedF != 'undefined') {
        this.teams[indexT].people[indexP].friends.push(
          draggedPerson.friends[draggedF]
        );
        draggedPerson.friends.splice(draggedF, 1);
      }
      else {
        if (indexT == draggedT && indexP == draggedP) {
          return;//Dragged to same person
        }

        // Flatten friends array
        var friendsToAdd = [];
        if (draggedPerson.friends?.length > 0) {
          friendsToAdd = draggedPerson.friends;
        }
        this.teams[indexT].people[indexP].friends.push(
          {
            name: draggedPerson.name,
            friends: []
          }
        );
        for (var previousFriend of friendsToAdd) {
          this.teams[indexT].people[indexP].friends.push(
            previousFriend);
        }
        this.teams[draggedT].people.splice(draggedP, 1);
      }

      this.save();
    },
    onDropTeam(evt, indexT) {
      this.dragging = false;
      const { draggedT, draggedP, draggedF } = JSON.parse(
        evt.dataTransfer.getData('indexes')
      );

      var draggedPerson = this.teams[draggedT].people[draggedP];
      if (typeof draggedPerson != 'undefined') {
        //If the dragged item still exists
        if (draggedT == indexT)
          return;//Dragged to same team

        if (typeof draggedF != 'undefined') {
          var draggedFriend = draggedPerson.friends[draggedF];
          if (typeof draggedFriend != 'undefined') {
            this.teams[indexT].people.push(
              draggedFriend
            );
            this.teams[draggedT].people[draggedP].friends.splice(draggedF, 1);
          }
          this.save();
        }
        else {
          this.teams[indexT].people.push(
            this.teams[draggedT].people[draggedP]
          );
          this.teams[draggedT].people.splice(draggedP, 1);
          this.save();
        }
      }
    }
  }
}
</script>
